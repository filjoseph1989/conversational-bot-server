const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.post('/api/generate', (req, res) => {
  // Destructure persona and user_prompt from the request body
  const { persona, user_prompt } = req.body;

  // Basic validation to ensure both fields are present
  if (!persona || !user_prompt) {
    return res.status(400).json({
      error: 'Request body must contain both a "persona" and a "user_prompt" field.',
    });
  }

  res.json({ persona, user_prompt });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});