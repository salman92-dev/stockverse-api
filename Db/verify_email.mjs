import pool from '../Db/db.mjs';
import dotenv from 'dotenv';
import { Router } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken'; // Importing jwt
import fetch from 'node-fetch';
import axios from 'axios';

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET; // Make sure JWT_SECRET is defined in your .env file
const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';
const GHL_API_KEY = process.env.GHL_API_KEY; // Set in your .env securely

async function verify_otp(req, res) {
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

        // Update the user's verification status
        await pool.query(`UPDATE register SET is_verified = true WHERE userid = $1`, [id]);

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

        // creating profile in klaviyo for new user

        const email = result.rows[0].email;
        const phone = result.rows[0].phone;
        const tag = "stockverse user";
        // Build contact payload from available inputs
        const createBody = {};
        if (email) createBody.email = email;
        if (phone) createBody.phone = phone;
        if (tag) createBody.tags = [tag];
        
        try {
            console.log('[Info] Creating new contact...');
            await axios.post(`${GHL_API_BASE}/contacts/`, createBody, {
            headers: {
                Authorization: `Bearer ${GHL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            });
        
            console.log('[Success] New contact created.');
        
        } catch (createErr) {
            console.error('[Create Contact Error]', createErr.response?.data || createErr.message);
        }

        // Send the response
        return res.status(207).json({ message: 'Email verified successfully', token: token });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error verifying OTP' });
    }
}

// Attach the route to the router
router.post('/verify-otp', verify_otp);

export default router;
