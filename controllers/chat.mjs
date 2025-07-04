import OpenAI from "openai";
import dotenv from "dotenv";
import pool from "../Db/db.mjs";
import jwt from "jsonwebtoken";
import axios from "axios"; // Import axios for API requests

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { chatId, command } = req.body;
    const token = req.cookies.authToken;

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.id;

      const chatHistory = await pool.query(`
        SELECT 
            c.chat_id,
            c.userid,
            c.title,
            c.created_at AS conversation_created_at,
            ch.question,
            ch.answer,
            ch.created_at AS chat_created_at
        FROM 
            conversation AS c
        JOIN 
            chats AS ch ON c.chat_id = ch.chat_id
        WHERE 
            c.userid = $1
        ORDER BY 
            c.created_at, ch.created_at
      `, [userId]);

      const messages = [
        {
          role: "system",
          content: "Always reference yourself as 'StockverseGPT' and do not say 'ChatGPT' or OpenAI model to users."
        },
      ];

      chatHistory.rows.forEach(({ question, answer }) => {
        messages.push({ role: "user", content: question });
        messages.push({ role: "assistant", content: answer });
      });

      messages.push({ role: "user", content: command });

      const completion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-4o",
        temperature: 1,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        functions: [
          {
            name: "get_latest_news",
            description: "Provides users the latest news from the function using an API.",
            parameters: {
              type: "object",
              required: ["symbol", "number_of_articles"],
              properties: {
                symbol: { type: "string", description: "The stock ticker symbol for which to retrieve the latest news" },
                number_of_articles: { type: "number", description: "The number of latest news articles to retrieve" },
              }
            }
          },
          {
            name: "get_stock_price",
            description: "Provides users the latest stock price of a specific symbol",
            parameters: {
              type: "object",
              required: ["symbol"],
              properties: {
                symbol: { type: "string", description: "The stock symbol" },
              }
            }
          }
        ],
        function_call: "auto"
      });

      const completionChoice = completion.choices[0];

      if (completionChoice.finish_reason === "function_call") {
        const { name, arguments: functionArgs } = completionChoice.message.function_call;

        if (name === "get_latest_news") {
          const { symbol, number_of_articles } = JSON.parse(functionArgs);

          const newsData = await getLatestNews(symbol, number_of_articles);

          messages.push({
            role: "assistant",
            content: `Here is the latest news for ${symbol}: ${newsData}`
          });

          const finalResponse = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o",
            temperature: 1,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          });

          const responseContent = finalResponse.choices[0].message.content;

          await pool.query(
            'INSERT INTO chats (chat_id, question, answer, created_at) VALUES ($1, $2, $3, NOW())',
            [chatId, command, responseContent]
          );

          return res.status(207).json({ answer: responseContent });
        }

        else if (name === "get_stock_price") {
          const { symbol } = JSON.parse(functionArgs);

          const stockPrice = await getStockPrice(symbol);

          messages.push({
            role: "assistant",
            content: `The current price for ${symbol} is ${stockPrice}.`
          });

          const finalResponse = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o",
            temperature: 1,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          });

          const responseContent = finalResponse.choices[0].message.content;

          await pool.query(
            'INSERT INTO chats (chat_id, question, answer, created_at) VALUES ($1, $2, $3, NOW())',
            [chatId, command, responseContent]
          );

          return res.status(207).json({ answer: responseContent });
        }
        else{
          return res.status(400).json({ error: "Unknown function call." });
        }
      }

      const responseContent = completionChoice.message.content;

      const title = await pool.query(
        'SELECT title FROM conversation WHERE chat_id = $1',
        [chatId]
      );
      if (title.rows.length > 0 && title.rows[0].title == null) {
        await pool.query(
          'UPDATE conversation SET title = $1 WHERE chat_id = $2',
          [command, chatId]
        );
      }

      await pool.query(
        'INSERT INTO chats (chat_id, question, answer, created_at) VALUES ($1, $2, $3, NOW())',
        [chatId, command, responseContent]
      );

      res.status(207).json({ answer: responseContent });
    } catch (error) {
      console.error("Error:", error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      if (error.code) {
        return res.status(500).json({ error: 'Database error', details: error.message });
      }
      res.status(500).json({ error: 'Failed to generate response' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Helper function to fetch news from Alpha Vantage API
async function getLatestNews(symbol) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  try {
    const response = await axios.get(`https://www.alphavantage.co/queryfunction=NEWS_SENTIMENT&tickers=${symbol}$apikey=${apiKey}`);
 if (response.status !== 200) {
      console.log(`symbols value is ${symbol}`);
      throw new Error(`Failed to fetch stock price: ${response.statusText}`);
    }
  
    return await response.data

  } catch (error) {
    console.error("Error fetching news:", error);
    return "Failed to retrieve news data.";
  }
}

// Helper function to fetch stock price from Alpha Vantage API

async function getStockPrice(symbol) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  try {
    const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
     if (response.status !== 200) {
      console.log(`symbols value is ${symbol}`);
      throw new Error(`Failed to fetch stock price: ${response.statusText}`);
    }
    const globalQuote = await response.data;
    return globalQuote;
    
  } catch (error) {
    console.error("Error fetching stock price:", error);
    return "Failed to retrieve stock price.";
  }
}
