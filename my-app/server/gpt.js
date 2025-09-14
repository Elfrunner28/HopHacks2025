
require("dotenv").config();
const OpenAI = require("openai");


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getGPTResponse(prompt) {
  if (!prompt) throw new Error("Prompt is required");

  const completion = await openai.chat.completions.create({
    model: "gpt-4",  // or "gpt-3.5-turbo"
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    max_tokens: 200,
  });

  return completion.choices[0].message.content;
}

module.exports = { getGPTResponse };
