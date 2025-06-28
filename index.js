import express from "express";
import fs from "fs";
import path from "path";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import "dotenv/config";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Destructure persona and user_prompt from the request body
    const { persona, user_prompt } = req.body;

    // Basic validation to ensure both fields are present
    if (!persona || !user_prompt) {
      return res.status(400).json({
        error: 'Request body must contain both a "persona" and a "user_prompt" field.',
      });
    }

    const prompt = `Persona: ${persona}\n\nUser: ${user_prompt}`;

    const genResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = genResponse.text;

    console.log('Gemini Generated text:', text);
    console.log("Generating speech from text using Google Cloud TTS...");

    // Construct the request
    const request = {
      input: { text: text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" }, // Select the language and SSML voice gender (optional)
      audioConfig: { audioEncoding: "MP3" }, // select the type of audio encoding
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Write the binary audio content to a local file
    const outputDir = path.join(__dirname, "outputs");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let i = 1;
    let speechFile;

    // Find the next available filename by incrementing the number
    while (true) {
      const paddedIndex = i.toString().padStart(2, "0");
      speechFile = path.join(outputDir, `speech-${paddedIndex}.mp3`);
      if (!fs.existsSync(speechFile)) {
        break;
      }
      i++;
    }

    await fs.promises.writeFile(speechFile, response.audioContent, "binary");
    console.log(`Audio content written to file: ${speechFile}`);

    res.json({
      message: "Audio generated successfully.",
      filePath: speechFile,
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});