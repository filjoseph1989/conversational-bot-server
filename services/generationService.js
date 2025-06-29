import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { GoogleGenAI } from "@google/genai";

// Initialize clients in the service file
const genAI     = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const ttsClient = new TextToSpeechClient();

/**
 * Generates text using the Gemini AI model.
 * @param {string} persona - The persona for the AI.
 * @param {string} prompt - The user's prompt.
 * @returns {Promise<string>} The generated and cleaned text.
 */
async function generateText(persona, prompt) {
    const textPrompt = `Persona: ${persona}\n\nUser: ${prompt}`;

    const genResponse = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        contents: textPrompt,
    });

    // Clean the text to remove markdown characters for better audio synthesis.
    const cleanedText = genResponse.text.replace(/[*#_~`]/g, "");
    console.log('Gemini Generated text (cleaned):', cleanedText);
    return cleanedText;
}

/**
 * Synthesizes speech from text using Google Cloud TTS.
 * @param {string} text - The text to synthesize.
 * @returns {Promise<string>} The Base64-encoded audio content.
 */
async function synthesizeSpeech(text) {
    console.log("Generating speech from text using Google Cloud TTS...");
    const request = {
        input: { text: text },
        voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioContent = response.audioContent.toString("base64");
    console.log("Audio content generated and encoded in Base64.");
    return audioContent;
}

/**
 * Generates text and synthesizes speech from the given persona and prompt.
 * @param {*} persona
 * @param {*} prompt
 * @returns
 */
export async function generateAndSynthesize(persona, prompt) {
    const text = await generateText(persona, prompt);
    const audioContent = await synthesizeSpeech(text);

    return { text, audioContent };
}

