const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    const secret = process.env.JWT_SECRET || 'secret_sample';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // contains id and email/name
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
