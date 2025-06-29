import express from "express";
import cors from 'cors';
import "dotenv/config";
import { generateAndSynthesize } from "./services/generationService.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for the client application
const corsOptions = {
  origin: process.env.CLIENT || 'http://localhost:5173',
};
app.use(cors(corsOptions));

// Middleware to parse JSON request bodies
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

    // Call the service to generate text and synthesize speech
    const result = await generateAndSynthesize(persona, prompt);

    res.json(result);
  } catch (error) {
    console.error('Error in /api/generate:', error);
    const message = error.message || 'Failed to generate response.';
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});