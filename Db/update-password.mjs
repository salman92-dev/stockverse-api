import express from 'express';
import cookieParser from "cookie-parser";
import pool from "./db.mjs";
import {jwtDecode} from "jwt-decode";  // Ensure you are importing this correctly
import bcrypt from 'bcrypt';  // Import bcrypt for hashing

const app = express();
app.use(express.json());
app.use(cookieParser());

async function update_pass(req, res) {
    const { password, newPassword } = req.body;
    const token = req.cookies.authToken;

    // Check if the token is provided before trying to decode it
    if (!token) {
        return res.status(401).json({ error: 'Authorization token not found in cookies' });
    }

    try {
        // Decode JWT token to get user id
        const decodedToken = jwtDecode(token);
        const id = decodedToken.id;

        // Ensure that the new password is not empty or undefined
        if (!newPassword) {
            return res.status(400).json({ error: 'Updated password is required' });
        }

        // Get the user's current hashed password from the database
        const userResult = await pool.query(
            'SELECT password FROM register WHERE userid = $1',
            [id]
        );

        // Check if user exists
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const storedHashedPassword = userResult.rows[0].password;

        // Compare the old password with the stored hashed password
        const isPasswordMatch = await bcrypt.compare(password, storedHashedPassword);
        if (!isPasswordMatch) {
            return res.status(208).json({ error: 'Old password is incorrect' });
        }

        // Hash the updated password using bcrypt
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // SQL query to update the hashed password for the user
        const response = await pool.query(
            'UPDATE register SET password = $2 WHERE userid = $1',
            [id, hashedNewPassword]  // Store the hashed password
        );

        // Check if the password was successfully updated
        if (response.rowCount > 0) {
            // Clear the authToken cookie and ask the user to log in again
            res.clearCookie('authToken', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',  // Set secure in production
                sameSite: 'None',
            });

            return res.status(207).json({ message: 'Password updated successfully. Please log in again.' });
        } else {
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default update_pass;
