const express = require('express');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', adminMiddleware, async (req, res) => {
  try {
    const { username, vehicleNumber, mobileNumber, vehicleType } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, vehicleNumber: vehicleNumber?.toUpperCase(), mobileNumber, vehicleType },
      { new: true, runValidators: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/submissions
router.get('/submissions', adminMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find().populate('user', 'username mobileNumber').sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
