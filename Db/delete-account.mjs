import pool from './db.mjs';
import { jwtDecode } from 'jwt-decode';
import bcrypt from 'bcrypt'; // Import bcrypt for password comparison

// DELETE user account endpoint
async function delete_account(req, res) {
    const token = req.cookies.authToken;

    // Check if the token exists
    if (!token) {
        return res.status(401).json({ message: 'Authorization token not found' });
    }

    let userId;
    try {
        // Decode the token and extract the user ID
        const decodedToken = jwtDecode(token);
        userId = decodedToken.id; // Extract user ID
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if the password is provided in the request body
    const { password } = req.body; // Assuming password is sent in the body

    if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: 'Password is required and must be a string' });
    }

    try {
        // Retrieve the stored hashed password from the database
        const result = await pool.query('SELECT password FROM register WHERE userid = $1', [userId]);

        // Check if the user exists
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const storedHashedPassword = result.rows[0].password;

        // Check if the stored password is a valid string
        if (typeof storedHashedPassword !== 'string') {
            return res.status(500).json({ message: 'Stored password is not valid' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, storedHashedPassword);

        if (!isMatch) {
            return res.status(403).json({ message: 'Incorrect password' });
        }

        // Delete user from the database
        const { rowCount } = await pool.query('DELETE FROM register WHERE userid = $1 RETURNING *', [userId]);

        // Respond based on the deletion result
        if (rowCount > 0) {
            return res.status(207).json({ message: 'User account deleted successfully' });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export default delete_account;
