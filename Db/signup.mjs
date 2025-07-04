import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import dotenv from 'dotenv';
import pool from './db.mjs';
import { body, validationResult } from 'express-validator';
import transporter from '../middlewares/nodemailer.mjs';

const app = express();
app.use(cookieParser());
dotenv.config();

async function postusers(req, res) {
    const { username, email, password, phone } = req.body;
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Check if a user with the same email already exists
        const existingUser = await pool.query(
            'SELECT * FROM register WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            if (user.is_verified) {
                return res.status(409).json({ message: 'Email already exists, please login' });
            } else {
                // User exists but is not verified, resend OTP
                const otpCode = generateOTP();
                const expiresAt = new Date(Date.now() + 10 * 60000); 

                // Update the OTP and expiration in the database
                await pool.query(
                    'UPDATE register SET otp = $1, expiration = $2 WHERE email = $3',
                    [otpCode, expiresAt, email]
                );

                // Send verification email with new OTP
                await transporter.sendMail({
                    from: 'sa0587676@gmail.com',
                    to: email,
                    subject: 'OTP Verification',
                    html: `<h2>Email Verification</h2><p>Your OTP is ${otpCode}</p>`,
                });

                return res.status(201).json({ message: 'OTP has been resent to your email for verification',id:user.userid });
            }
        }

        // Hash the user's password
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); 

        // Insert the new user into the database
        const result = await pool.query(
            'INSERT INTO register (fullname, email, password, is_verified, otp, expiration, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [username, email, hashedPassword, false, otpCode, expiresAt, phone]
        );
        const user = result.rows[0];

        // await pool.query(
        //     `INSERT INTO subscription (
        //         userid, customer_id, email, start_date, expires_at, renew, status, subscription_id, price_id, counter
        //     ) 
        //     VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)`,
        //     [
        //         user.userid,             
        //         'N/A',                       
        //         user.email,
        //         '2070-01-01 00:00:00',                  
        //         false,                                 
        //         'active',                       
        //         'N/A',                          
        //         'price_free',
        //         5                    
        //     ]
        // );
        await pool.query(
            `INSERT INTO subscription (
                userid, customer_id, email, start_date, expires_at, renew, status, subscription_id, price_id, counter
            ) 
            VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days', $4, $5, $6, $7, $8)`,
            [
                user.userid,       // $1
                'N/A',             // $2
                user.email,        // $3
                false,             // $4 - renew
                'active',          // $5 - status
                'N/A',             // $6 - subscription_id
                'price_free',      // $7 - price_id
                3                  // $8 - counter
            ]
        );

        
        // Send verification email
        await transporter.sendMail({
            from: 'support@stockverse.com',
            to: email,
            subject: 'OTP Verification',
            html: `<h2>Email Verification</h2><p>Your OTP is ${otpCode}</p>`,
        });

        // Send a response after all operations are completed
        return res.status(201).json({ message: 'Registration successful, please check your email to verify your account', id: user.userid });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: error });
    }
}

export default postusers;
