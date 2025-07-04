import express from 'express';
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

// Logout route
async function logout(req, res){
    // Clear the authToken cookie
    res.clearCookie('authToken', { 
        httpOnly: true, // Cookie is not accessible via JavaScript
        secure: true, // Set to true only if using HTTPS
        sameSite: 'None' // Helps prevent CSRF attacks
    });

    return res.status(200).json({ message: 'Logged out successfully' });
};
export default logout;

