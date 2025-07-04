import pool from "../Db/db.mjs";
import bcrypt from 'bcryptjs';

async function reset_password(req, res) {
  const { id,OTP, newPassword } = req.body;

  try {
    // Check if token is valid and not expired
    const resetTokenResult = await pool.query(
      'SELECT otp, expiration FROM register WHERE userid = $1',
      [id]
    );
    const userId = resetTokenResult.rows[0].userid; 
        // Hash the new password using bcrypt
        const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (resetTokenResult.rows[0].expiration < Date.now() || resetTokenResult.rows[0].otp !==OTP) {
      return res.status(208).json({ message: 'Token is invalid or expired' });
    }
    else if(resetTokenResult.rows[0].expiration > Date.now() || resetTokenResult.rows[0].otp===OTP){
      await pool.query(
        'UPDATE register SET password = $1 WHERE userid = $2',
        [hashedPassword, id]
      );
    }
    res.status(207).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};

export default reset_password;
