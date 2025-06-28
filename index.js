const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const app = express();
const PORT = process.env.PORT || 3000;

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

    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured.');
      return res.status(500).json({ error: 'Server configuration error: ElevenLabs API key not set.' });
    }

    const prompt = `Persona: ${persona}\n\nUser: ${user_prompt}`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text;
    const elevenLabsVoiceId = '21m00Tcm4TlvDq8ikWAM'; // A default voice ID, e.g., "Rachel"
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`;

    const elevenLabsResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.text();
      console.error('ElevenLabs API Error:', errorData);
      return res.status(elevenLabsResponse.status).json({ error: 'Failed to generate audio from ElevenLabs.' });
    }

    // res.setHeader('Content-Type', 'audio/mpeg');
    // elevenLabsResponse.body.pipe(res);

    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, `output-${Date.now()}.mp3`);
    await streamPipeline(
      elevenLabsResponse.body,
      fs.createWriteStream(filePath)
    );

    res.json({
      message: 'Audio generated successfully.',
      filePath: filePath
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});