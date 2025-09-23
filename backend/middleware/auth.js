import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  console.log('🔐 Auth middleware - Authorization header:', req.header('Authorization'));
  console.log('🔐 Auth middleware - Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.log('❌ Auth middleware - No token found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Auth middleware - Token decoded successfully:', { userId: decoded.userId, username: decoded.username });
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err) {
    console.log('❌ Auth middleware - Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}
