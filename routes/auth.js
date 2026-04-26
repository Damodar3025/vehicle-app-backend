const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, vehicleNumber, mobileNumber, vehicleType } = req.body;

    if (!username || !password || !vehicleNumber || !mobileNumber || !vehicleType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check unique fields
    const existingVehicle = await User.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
    if (existingVehicle) return res.status(400).json({ message: 'Vehicle number already registered' });

    const existingMobile = await User.findOne({ mobileNumber });
    if (existingMobile) return res.status(400).json({ message: 'Mobile number already registered' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      vehicleNumber: vehicleNumber.toUpperCase(),
      mobileNumber,
      vehicleType,
    });

    await user.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        vehicleNumber: user.vehicleNumber,
        mobileNumber: user.mobileNumber,
        vehicleType: user.vehicleType,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Simple hardcoded admin — change these in production!
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }
    const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
