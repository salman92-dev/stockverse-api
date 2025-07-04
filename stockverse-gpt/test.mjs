import OpenAI from "openai";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pool from "../Db/db.mjs";
import stockverseGPT from "./stockverse_gpt.mjs"; // Import stockverse-gpt controller directly
// import stockverseGPT from "./xai.mjs";

dotenv.config();

export default async function test(req, res) {
    if (req.method === 'POST') {
        const { chatId, command } = req.body;
        const token = req.cookies.authToken;
        let answer = 'StockverseGPT is unavailable right now, please try again later!'; // Default answer in case of errors

        try {
            // Verify JWT and extract userId
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.id;

            // Fetch chat history from the database
            const chatHistoryResult = await pool.query(`
                SELECT 
                    c.chat_id,
                    c.userid,
                    c.created_at AS conversation_created_at,
                    ch.question,
                    ch.answer,
                    ch.created_at AS chat_created_at
                FROM 
                    conversation AS c
                JOIN 
                    chats AS ch ON c.chat_id = ch.chat_id
                WHERE 
                    c.userid = $1 AND c.chat_id = $2
                ORDER BY 
                    c.created_at, ch.created_at
            `, [userId, chatId]);

            console.log("chat data extracted", chatHistoryResult.rows);
            const chatHistory = chatHistoryResult; // Convert query result to array of rows
            // Call stockverse-gpt function directly and get the answer
            const response = await stockverseGPT({ command, chatHistory });

            // Check if response is received and contains an answer
            if (response && response.answer) {
                answer = response.answer;
            }

            // Fetch the title from the conversation if needed
            const titleResult = await pool.query(
                'SELECT title FROM conversation WHERE chat_id = $1',
                [chatId]
            );

            // Update the title if it's currently null
            if (titleResult.rows.length > 0 && titleResult.rows[0].title == null) {
                await pool.query(
                    'UPDATE conversation SET title = $1 WHERE chat_id = $2',
                    [command, chatId]
                );
            }

            // Insert the command and response into the chats table
            if (answer) {
                await pool.query(
                    'INSERT INTO chats (chat_id, question, answer, created_at) VALUES ($1, $2, $3, NOW())',
                    [chatId, command, answer]
                );
            }
            
            const result = await pool.query('SELECT * FROM subscription WHERE userid = $1', [userId]);
            let counter = result.rows[0].counter;
            let priceId = result.rows[0].price_id;

            if (counter > 0 && priceId === 'price_free') {
            counter -= 1;

            // Update the new counter in the DB
            await pool.query('UPDATE subscription SET counter = $1 WHERE userid = $2', [counter, userId]);
            }

            // Send the answer and updated counter to the client
            res.status(207).json({ answer, counter });

        } catch (error) {
            console.error("Error in test controller:", error);
            res.status(500).json({ error: 'An error occurred while processing your request.' });
        }

    } else {
        res.status(405).json({ error: 'Invalid Request Method' });
    }
}