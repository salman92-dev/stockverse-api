import pool from '../Db/db.mjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; // Importing jwt

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; // Make sure JWT_SECRET is defined in your .env file

async function verify_tfa(req, res) {
    const { id, OTP } = req.body;

    try {
        // Query to check if the OTP exists and is not expired
        const result = await pool.query(
            `SELECT * FROM register WHERE userid = $1 AND otp = $2 AND expiration > NOW()`,
            [id, OTP]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: result.rows[0].userid }, JWT_SECRET, {
            expiresIn: '6h',
        });

        // Set the cookie with the token
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: true, // Set to true only if using HTTPS
            sameSite: 'None', // Default option, helps prevent CSRF attacks
            path: '/',
        });

        // Send the response
        return res.status(207).json({ message: '2 FA  verified successfullt.', token: token });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error verifying 2 FA' });
    }
}


export default verify_tfa;
