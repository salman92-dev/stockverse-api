import express from 'express';
import pool from '../Db/db.mjs';

const router = express.Router();

// DELETE route to delete a conversation and associated chats by chat_id
async function  delete_chats(req, res){
    const chatId = parseInt(req.body.chatId, 10);

    // Check if chatId is a valid number
    if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chatId" });
    }

    try {
        // Begin a transaction
        await pool.query('BEGIN');

        // Delete associated chats
        await pool.query('DELETE FROM chats WHERE chat_id = $1', [chatId]);

        // Delete the conversation
        const result = await pool.query('DELETE FROM conversation WHERE chat_id = $1', [chatId]);

        // Check if any conversation was deleted
        if (result.rowCount === 0) {
            await pool.query('ROLLBACK'); // Rollback if no conversation was found
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Commit the transaction
        await pool.query('COMMIT');

        // Respond with success message
        res.status(200).json({ message: "Conversation and associated chats deleted successfully" });
    } catch (error) {
        console.error(error);
        await pool.query('ROLLBACK'); // Rollback in case of error
        res.status(500).json({ message: "Internal server error" });
    }
};

export default delete_chats;
