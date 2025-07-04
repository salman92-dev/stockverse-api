import express from 'express';
import cookieParser from "cookie-parser";
import pool from "./db.mjs";
import { jwtDecode } from "jwt-decode";  // Ensure you are importing this correctly

const app = express();
app.use(express.json());
app.use(cookieParser());

async function update_username(req, res) {
    const { fullname } = req.body;
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
        if (!fullname) {
            return res.status(400).json({ error: 'Fullnameis required' });
        }

        // SQL query to update the hashed password for the user
        const response = await pool.query(
            'UPDATE register SET fullname = $2 WHERE userid = $1',
            [id, fullname]  // Store the hashed password
        );

        // Check if the password was successfully updated
        if (response.rowCount > 0) {
            return res.status(207).json({ message: 'Name Updated Successfully' });
        }
    } catch (error) {
        console.error('Error updating Fullname:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default update_username;
