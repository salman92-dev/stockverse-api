import pool from "../Db/db.mjs";

async function get_conversation(req, res) {
    const { userid } = req.body; // Destructure userid directly from req.body

    if (!userid) { // Check if userid is provided
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const { rows: conversations } = await pool.query(
            'SELECT * FROM conversation WHERE userid = $1',
            [userid]
        );

        res.status(200).json({
            message: 'Data fetched successfully',
            response: conversations,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Data could not be fetched" });
    }
}

export default get_conversation;
