import express from "express";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CLIENT || 'http://localhost:5173',
};
app.use(cors(corsOptions));

// Creates a client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new TextToSpeechClient();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.post('/api/generate', async (req, res) => {
  try {
    // Destructure persona and prompt from the request body
    const { persona, prompt } = req.body;

    // Basic validation to ensure both fields are present
    if (!persona || !prompt) {
      return res.status(400).json({
        error: 'Request body must contain both a "persona" and a "prompt" field.',
      });
    }

    const textPrompt = `Persona: ${persona}\n\nUser: ${prompt}`;

    const genResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: textPrompt,
    });


    // Clean the text to remove markdown characters for better audio synthesis.
    // This removes characters like *, #, _, ~, and ` that are used for formatting.
    const text = genResponse.text.replace(/[*#_~`]/g, "");

    console.log('Gemini Generated text (cleaned):', text);
    console.log("Generating speech from text using Google Cloud TTS...");

    // Construct the request
    const request = {
      input: { text: text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" }, // Select the language and SSML voice gender (optional)
      audioConfig: { audioEncoding: "MP3" }, // select the type of audio encoding
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Convert the binary audio content to a Base64 string to stream to the client
    const audioContent = response.audioContent.toString("base64");
    console.log("Audio content generated and encoded in Base64.");

    res.json({
      text: text,
      audioContent: audioContent,
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});