const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Support both userId and id for backwards compatibility
    const userId = decoded.userId || decoded.id;
    if (userId && userId !== 'admin') {
      const user = await User.findById(userId).select('-password');
      if (user) {
        req.user = {
          ...decoded,
          id: user._id,
          userId: user._id,
          username: user.username,
          vehicleNumber: user.vehicleNumber,
          isAdmin: user.isAdmin || false,
        };
      } else {
        req.user = { ...decoded, id: decoded.userId || decoded.id };
      }
    } else {
      req.user = { ...decoded, id: decoded.userId || decoded.id };
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
