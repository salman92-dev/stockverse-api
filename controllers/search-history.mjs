import pool from "../Db/db.mjs";
import { jwtDecode } from "jwt-decode";

async function search_history(req, res) {
    const { symbol } = req.body;
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token is missing' });
    }

    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    if (!symbol) {
        return res.status(400).json({ error: 'keyword is required' });
    }

    try {
        
        const existingSymbol = await pool.query(
            'SELECT DISTINCT keyword FROM user_search_history WHERE userid = $1 AND keyword = $2', 
            [userId, symbol]
        );

        if (existingSymbol.rows.length > 0) {
            return res.status(400).json({ message: `Stock ${symbol} is already in your Search History` });
        }

        // Insert the new symbol into the watchlist if it's not already there
        await pool.query(
            'INSERT INTO user_search_history (userid, keyword) VALUES ($1, $2)', 
            [userId, symbol]
        );
        return  res.status(207).json({ symbol: `${symbol}` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default search_history;
