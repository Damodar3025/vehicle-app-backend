const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    // ── Check .env admin credentials first ──────────────────────
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { userId: 'admin', isAdmin: true, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        token,
        user: {
          _id:           'admin',
          username:      process.env.ADMIN_USERNAME,
          vehicleNumber: '',
          vehicleType:   '',
          mobileNumber:  process.env.ADMIN_MOBILE || '',
          isAdmin:       true,
        },
      });
    }

    // ── Regular user login ───────────────────────────────────────
    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id:           user._id,
        username:      user.username,
        vehicleNumber: user.vehicleNumber,
        vehicleType:   user.vehicleType,
        mobileNumber:  user.mobileNumber,
        isAdmin:       user.isAdmin || false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, vehicleNumber, mobileNumber, vehicleType } = req.body;
    if (!username || !password || !vehicleNumber || !mobileNumber || !vehicleType)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ message: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hash,
      vehicleNumber: vehicleNumber.toUpperCase(),
      mobileNumber,
      vehicleType,
    });

    const token = jwt.sign(
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        _id:           user._id,
        username:      user.username,
        vehicleNumber: user.vehicleNumber,
        vehicleType:   user.vehicleType,
        mobileNumber:  user.mobileNumber,
        isAdmin:       false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;