import pool from '../Db/db.mjs';

async function get_user_queries(req, res) {
    const { chatId } = req.body; // Destructure chatId directly from req.body


    if (!chatId) {
        return res.status(400).json({ message: "chatId must be a valid integer" });
    }

    try {
        // Check if chatId is still valid (though already validated above, it's redundant)
        if (!chatId) {
            return res.status(401).json({ message: "Unauthorized: No CHATID provided" });
        }

        // Query the database using chatIdInt
        const user = await pool.query('SELECT * FROM chats WHERE chat_id = $1', [chatId]);
        const userarr = user.rows;

        // Return the user data
        res.status(200).json({ user: userarr });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" }); // Change to 500 for server error
    }
}

export default get_user_queries;
