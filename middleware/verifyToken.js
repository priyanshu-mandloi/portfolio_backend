import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();


export const verifyToken = (req, res, next) => {
  let token = req.cookies?.token || null;

  const authHeader = req.headers?.authorization;
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not Authenticated!' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Token is not Valid!' });

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    req.userId = payload.id;     // backward compatibility (you used this in places)
    req.userRole = payload.role; // optional convenience
    next();
  });
};
