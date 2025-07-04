import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.mjs'; 
import dotenv from 'dotenv';
import transporter from '../middlewares/nodemailer.mjs'


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

async function getsignin(req, res) {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const userResult = await pool.query('SELECT * FROM register WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid  password' });
        }

        // Check if the user has verified their email
        if (!user.is_verified) {
            const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
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
        if(user.tfa === true){
            const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
            const otpCode = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60000); 
             // Update the OTP and expiration in the database
                await pool.query(
                    'UPDATE register SET otp = $1, expiration = $2 WHERE email = $3',
                    [otpCode, expiresAt, email]
                );

                // Send verification email with new OTP
                await transporter.sendMail({
                    from: 'support@stockverse.com',
                    to: email,
                    subject: 'OTP Verification',
                    html: `<h2>OTP Verification</h2><p>Your OTP is ${otpCode}</p>`,
                });
                return res.status(202).json({ message: 'OTP has been sent to your email for verification',id:user.userid });
        }
        // Generate JWT token
        const token = jwt.sign({ id: user.userid }, JWT_SECRET, {
            expiresIn: '24h',
        });
        if (user && isMatch && user.is_verified) {
            return res.cookie('authToken', token, {
                httpOnly: true,
                secure: true, // Set to true only if using HTTPS
                sameSite: 'None', // Default option, helps prevent CSRF attacks
                path: '/',
            }).send({ message: 'Login successful', token: token });
        } else {
            return res.status(400).json({ error: 'Please verify your email before logging in' });
        }
        

    } catch (error) {
        console.error('Error during sign-in:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
}

export default getsignin;