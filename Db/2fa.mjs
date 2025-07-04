import express from 'express';
import cookieParser from 'cookie-parser';
import pool from './db.mjs';  // Import your database connection
import {jwtDecode} from 'jwt-decode';  // Import jwt-decode correctly

const app = express();
app.use(express.json());
app.use(cookieParser());

async function toggle2FA(req, res) {
    const token = req.cookies.authToken;  // Assuming JWT is stored in cookies

    // Check if the token exists in the cookies
    if (!token) {
        return res.status(401).json({ error: 'Authorization token not found' });
    }

    try {
        // Decode the JWT token to get the user ID
        const decodedToken = jwtDecode(token);
        const id = decodedToken.id;  // Assumes the token contains user ID in 'id' field

        // Get the current 2fa status from the database
        const result = await pool.query(
            'SELECT "tfa" FROM register WHERE userid = $1',
            [id]
        );

        // Check if the user exists
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get current 2FA status
        const current2FA = result.rows[0].tfa;

        // Toggle the 2FA status (if true, set to false, and vice versa)
        const new2FAStatus = !current2FA;

        // Update the 2FA status in the database
        await pool.query(
            'UPDATE register SET "tfa" = $1 WHERE userid = $2',
            [new2FAStatus, id]
        );

        // Send the response based on the new status
        if (new2FAStatus) {
            return res.status(207).json({ message: '2FA enabled successfully.' });
        } else if (!new2FAStatus) {
            return res.status(206).json({ message: '2FA disabled successfully.' });
        }
        else{
            return res.status(208).json({message : 'operation failed'});
        }

    } catch (error) {
        console.error('Error toggling 2FA:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default toggle2FA;
