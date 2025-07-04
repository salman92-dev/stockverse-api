import pool from './db.mjs';

async function favourite_chats(req, res) {
    const { chatId } = req.body;
    try {
        if (!chatId) {
            return res.status(400).json({ message: 'CHATID was not provided' });
        }

        // Check the current status of the 'favourite' column for the chat
        const checkResult = await pool.query(
            'SELECT favourite FROM conversation WHERE chat_id = $1',
            [chatId]
        );

        if (checkResult.rows[0].favourite === false) {
            await pool.query(
                'UPDATE conversation SET favourite = true WHERE chat_id = $1',
                [chatId]
            );
            return res.status(207).json({message: 'chat added to your favourite', chatId :chatId})
        }
        else if(checkResult.rows[0].favourite === true){
            await pool.query(
                'UPDATE conversation SET favourite = false WHERE chat_id = $1',
                [chatId]
            );
            return res.status(201).json({message: 'chat removed from favourite', chatId:chatId})
        }

        else {
            return res.status(500).json({ message: 'Failed to update favourite status' });
        }
    } catch (error) {
        console.error('Error toggling favourite status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default favourite_chats;
