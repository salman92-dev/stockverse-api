import pool from "./db.mjs";
import transporter from "../middlewares/nodemailer.mjs";


async function resend_otp(req, res){
    const { id } = req.body;
  
    try {
      // Get the user by email
      const user = await pool.query(`SELECT * FROM register WHERE userid = $1`, [id]);
  
      if (user.rows.length === 0) {
        return res.status(400).json({ error: 'User not found' });
      }
  
      // Check if the user is already verified
      if (user.rows[0].is_verified) {
        return res.status(208).json({ message: 'User is already verified' });
      }
  
      // Generate new OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60000); // OTP expires in 10 minutes
  
      // Update OTP in the database
      await pool.query(
        `UPDATE register SET otp = $1, expiry = $2 WHERE userid = $3`,
        [otpCode, expiresAt, user.rows[0].id]
      );
  
      // Resend OTP via email
      await transporter.sendMail({
        from: 'support@stockverse.com',
        to: email,
        subject: 'OTP - Verify your email',
        text: `Your OTP code is ${otpCode}. It will expire in 10 minutes.`,
      });
  
      res.status(207).json({ message: `OTP resent to email ${user.rows[0].email}` });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Error resending OTP' });
    }
  };

export default resend_otp;
  