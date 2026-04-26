const express = require('express');
const Submission = require('../models/Submission');
const { authMiddleware } = require('../middleware/auth');
const sendSMS = require('../middleware/sms');

const router = express.Router();

// POST /api/submissions — create new submission and send SMS
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { vehicleNumber, numberOfTons, amount, factoryPlace } = req.body;

    if (!vehicleNumber || !numberOfTons || !amount || !factoryPlace) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const validPlaces = ['Mandya', 'Shivamogga', 'Hospet'];
    if (!validPlaces.includes(factoryPlace)) {
      return res.status(400).json({ message: 'Invalid factory place' });
    }

    const submission = new Submission({
      user: req.user.id,
      username: req.user.username,
      vehicleNumber: vehicleNumber.toUpperCase(),
      numberOfTons,
      amount,
      factoryPlace,
    });

    await submission.save();

    // Send SMS to admin number
    const message = `Vehicle App Alert: Username: ${req.user.username} | Vehicle No: ${vehicleNumber.toUpperCase()} | Tons: ${numberOfTons} | Amount: Rs.${amount} | Factory: ${factoryPlace}`;
    const smsResult = await sendSMS(message);
    if (smsResult.success) {
      submission.smsSent = true;
      await submission.save();
    }

    res.status(201).json({
      message: 'Submission successful' + (smsResult.success ? ' and SMS sent' : ' (SMS failed, check API key)'),
      submission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/submissions/my — get logged-in user's submissions
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
