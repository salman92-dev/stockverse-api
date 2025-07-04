import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const verifyToken = (req, res, next) => {
  // Corrected way to access the token from cookies
  const token = req.cookies.authToken;
  
  if (!token) {
      return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(403).json({ message: 'Failed to authenticate token' });
    }
      req.userid = decoded.id; // Set the userId in the request for further use
      console.log('Token verified, user ID:', req.userid);
      next(); // Proceed to the next middleware or route handler
  });
};

export default verifyToken;
