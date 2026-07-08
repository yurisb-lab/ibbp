// functions/index.js
// Firebase Cloud Function — proxy para API da Anthropic

const functions = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const fetch = require("node-fetch");

exports.generateDevotional = onRequest({
  cors: true,
  secrets: ["ANTHROPIC_KEY"],
}, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt é obrigatório" });
      return;
    }

    const apiKey = process.env.ANTHROPIC_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Chave da API não configurada" });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
