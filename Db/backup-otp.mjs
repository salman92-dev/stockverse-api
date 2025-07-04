import pool from "./db.mjs";
import transporter from "../middlewares/nodemailer.mjs";


async function backup_otp(req, res){
    const { id } = req.body;
      const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
  
    try {
      // Get the user by email
      const user = await pool.query(`SELECT * FROM register WHERE userid = $1`, [id]);
  
      if (user.rows.length === 0) {
        return res.status(400).json({ error: 'User not found' });
      }
  
  
      // Generate new OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60000); // OTP expires in 10 minutes
  
      // Update OTP in the database
      await pool.query(
        `UPDATE register SET otp = $1, expiration = $2 WHERE userid = $3`,
        [otpCode, expiresAt,id]
      );
  
      // Resend OTP via email
      await transporter.sendMail({
        from: 'sa0587676@gmail.com',
        to: user.rows[0].email,
        subject: 'OTP - Verify your email',
        text: `Your OTP code is ${otpCode}. It will expire in 10 minutes.`,
      });
  
      res.status(200).json({ message: `OTP resent to email ${user.rows[0].email}` });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Error resending OTP' });
    }
  };

export default backup_otp;
  