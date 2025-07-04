import { jwtDecode } from 'jwt-decode';
import pool from '../Db/db.mjs';

async function get_user(req, res) {
    try {
        const token = req.cookies.authToken; // Access the token from cookies
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decodedToken = jwtDecode(token);

        // First query: Get user data from 'register' table
        const userResult = await pool.query(
            'SELECT userid, fullname, email, is_verified, tfa FROM register WHERE userid = $1',
            [decodedToken.id]
        );

        res.status(200).json(userResult.rows[0]);

    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(400).json({ message: "Error fetching user data" });
    }
}

export default get_user;
