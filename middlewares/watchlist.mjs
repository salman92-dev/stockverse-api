import pool from "../Db/db.mjs";
import {jwtDecode} from "jwt-decode";

async function toggleFavorite(req, res) {
    const { symbol } = req.body;
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token is missing' });
    }

    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    if (!symbol) {
        return res.status(400).json({ error: 'Stock symbol is required' });
    }

    try {
        // Check if the symbol already exists in the user's watchlist using EXISTS
        const symbolExists = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM watchlist WHERE userid = $1 AND symbol = $2)', 
            [userId, symbol]
        );

        if (symbolExists.rows[0].exists) {
            // If it exists, delete it from the watchlist
            await pool.query('DELETE FROM watchlist WHERE userid = $1 AND symbol = $2', [userId, symbol]);
            return res.status(200).json({ symbol: `${symbol}` });
        } else {
            // If it does not exist, insert it into the watchlist
            await pool.query('INSERT INTO watchlist (userid, symbol) VALUES ($1, $2)', [userId, symbol]);
            return res.status(207).json({ symbol: `${symbol}` });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default toggleFavorite;
