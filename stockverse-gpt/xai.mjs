import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.XAI_API_KEY;

const openai = new OpenAI({
    apiKey: `${apiKey}`,
    baseURL: "https://api.x.ai/v1", // New base URL
});

export default async function stockverseGPT({ command, chatHistory }) {
    const systemMessage = `You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy. but always reference yourself as StockverseGPT and stocks assistant.`;

    try {
        const chat = await openai.chat.completions.create({
            model: "grok-beta", // Updated model
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: command },
            ],
            temperature: 1,
            max_tokens: 2048,
        });

        const answer = chat.choices[0].message.content;
        console.log("Answer:", answer);

        return { answer: answer };
    } catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to generate a response.");
    }
}