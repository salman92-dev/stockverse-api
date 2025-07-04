import express from 'express';
import transporter from '../middlewares/nodemailer.mjs';


const app = express();

async function feedback(req, res){
    const { firstName,lastName, email, feedback } = req.body;

    try {
        await transporter.sendMail({
            from: email,
            to: 'relqomedia@gmail.com, support@stockverse.com',
            subject: `Feedback from ${firstName} ${lastName}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #082e99; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">New Feedback Received</h2>
      </div>
      <div style="padding: 20px; color: #333;">
        <h3 style="margin-top: 0; color: #082e99;">Details:</h3>
        <p><strong>First Name:</strong> ${firstName}</p>
        <p><strong>Last Name:</strong> ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${feedback}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">This is an automated email. Please do not reply to this message.</p>
      </div>
    </div>
            `,
        });
        return res.status(200).json({ message: 'Feedback sent successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error sending feedback' });
    }
};
export default feedback;