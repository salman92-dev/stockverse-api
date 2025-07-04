import pool from "../Db/db.mjs";// Import your database connection
import { jwtDecode } from "jwt-decode";


async function getUserData(req, res) {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token is missing' });
    }

    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    try {
        const userPromise = pool.query('SELECT userid,fullname,email,password FROM register WHERE userid = $1', [userId]);
        const historyPromise = pool.query('SELECT * FROM user_search_history WHERE userid = $1', [userId]);
        const favoritesPromise = pool.query('SELECT * FROM watchlist WHERE userid = $1', [userId]);


        // Wait for all promises to resolve
        const [userData, historyData, favoritesData ] = await Promise.all([
            userPromise,
            historyPromise,
            favoritesPromise,
        ]);

        // Structure the response
        const responseData = {
            user: userData.rows[0], // Assuming you want only one user
            history: historyData.rows,
            favorites: favoritesData.rows,
        };

        // Send the combined response
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default getUserData;
