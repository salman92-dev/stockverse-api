import pool from '../Db/db.mjs';
import transporter from '../middlewares/nodemailer.mjs';

async function forgot_pass(req, res) {
  const { email } = req.body;
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
  try {
    // Check if user exists
    const user = await pool.query('SELECT userid FROM register WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate token and expiration
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60000); 

    // Insert or update password reset token
    await pool.query(
      'UPDATE register SET otp = $1, expiration = $2 WHERE userid = $3;',
      [otpCode, expiresAt, user.rows[0].userid]
    );    

    // Send password reset email
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      text: `You requested a password reset. This is your OTP: ${otpCode}`,
    });

    res.status(201).json({ message: 'Otp has been sent to email',id :user.rows[0].userid });
  } catch (err) {
    console.error('Error in forgot_pass function:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default forgot_pass;
