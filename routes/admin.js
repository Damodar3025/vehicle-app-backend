const express = require('express');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── existing routes ────────────────────────────────────────────────

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
    const submissions = await Submission.find()
      .populate('user', 'username mobileNumber')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── NEW dashboard routes ───────────────────────────────────────────

/**
 * GET /api/admin/dashboard/summary
 * Query params: startDate, endDate, month (YYYY-MM), factoryPlace, vehicleNumber
 *
 * Returns:
 *  - totalTrips, totalTons, totalAmount (cumulative)
 *  - perVehicle breakdown
 *  - perFactory breakdown
 *  - perDay timeline
 */
router.get('/dashboard/summary', adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, month, factoryPlace, vehicleNumber } = req.query;

    // Build date filter
    const dateFilter = {};
    if (month) {
      // e.g. month=2026-05
      const [y, m] = month.split('-').map(Number);
      dateFilter.$gte = new Date(y, m - 1, 1);
      dateFilter.$lt  = new Date(y, m, 1);
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate)   dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // Build match stage
    const match = {};
    if (Object.keys(dateFilter).length) match.createdAt = dateFilter;
    if (factoryPlace) match.factoryPlace = factoryPlace;
    if (vehicleNumber) match.vehicleNumber = vehicleNumber.toUpperCase();

    // ── Overall summary ──────────────────────────────────────────
    const [summary] = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
          avgTonsPerTrip:   { $avg: '$numberOfTons' },
          avgAmountPerTrip: { $avg: '$amount' },
        },
      },
    ]);

    // ── Per vehicle breakdown ─────────────────────────────────────
    const perVehicle = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$vehicleNumber',
          username:    { $first: '$username' },
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // ── Per factory breakdown ─────────────────────────────────────
    const perFactory = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$factoryPlace',
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // ── Per day timeline ──────────────────────────────────────────
    const perDay = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Unique factory places ─────────────────────────────────────
    const factories = await Submission.distinct('factoryPlace');
    const vehicles  = await Submission.distinct('vehicleNumber');

    res.json({
      summary: summary || {
        totalTrips: 0, totalTons: 0, totalAmount: 0,
        avgTonsPerTrip: 0, avgAmountPerTrip: 0,
      },
      perVehicle,
      perFactory,
      perDay,
      filters: { factories, vehicles },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/admin/dashboard/user/:userId
 * Query params: startDate, endDate, month
 *
 * Returns stats for a single user/driver
 */
router.get('/dashboard/user/:userId', adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;

    const dateFilter = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      dateFilter.$gte = new Date(y, m - 1, 1);
      dateFilter.$lt  = new Date(y, m, 1);
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate)   dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const match = { user: require('mongoose').Types.ObjectId.createFromHexString(req.params.userId) };
    if (Object.keys(dateFilter).length) match.createdAt = dateFilter;

    const [summary] = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTrips:       { $sum: 1 },
          totalTons:        { $sum: '$numberOfTons' },
          totalAmount:      { $sum: '$amount' },
          avgTonsPerTrip:   { $avg: '$numberOfTons' },
          avgAmountPerTrip: { $avg: '$amount' },
        },
      },
    ]);

    const perDay = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          trips:  { $sum: 1 },
          tons:   { $sum: '$numberOfTons' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const recentTrips = await Submission.find(match)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      summary: summary || {
        totalTrips: 0, totalTons: 0, totalAmount: 0,
        avgTonsPerTrip: 0, avgAmountPerTrip: 0,
      },
      perDay,
      recentTrips,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/admin/dashboard/me  (for logged-in driver — no adminMiddleware)
 * Uses req.user from authMiddleware
 */
router.get('/dashboard/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;

    const dateFilter = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      dateFilter.$gte = new Date(y, m - 1, 1);
      dateFilter.$lt  = new Date(y, m, 1);
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate)   dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const match = { user: req.user._id };
    if (Object.keys(dateFilter).length) match.createdAt = dateFilter;

    const [summary] = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTrips:       { $sum: 1 },
          totalTons:        { $sum: '$numberOfTons' },
          totalAmount:      { $sum: '$amount' },
          avgTonsPerTrip:   { $avg: '$numberOfTons' },
          avgAmountPerTrip: { $avg: '$amount' },
        },
      },
    ]);

    const perDay = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          trips:  { $sum: 1 },
          tons:   { $sum: '$numberOfTons' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const recentTrips = await Submission.find(match)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      summary: summary || {
        totalTrips: 0, totalTons: 0, totalAmount: 0,
        avgTonsPerTrip: 0, avgAmountPerTrip: 0,
      },
      perDay,
      recentTrips,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;