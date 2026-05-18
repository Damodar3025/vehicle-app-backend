const express = require('express');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/admin/users ──────────────────────────────────────────
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /api/admin/users/:id ──────────────────────────────────────
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

// ── DELETE /api/admin/users/:id ───────────────────────────────────
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Helper: build a date + field match from query params ──────────
function buildMatch(query) {
  const { startDate, endDate, month, factoryPlace, vehicleNumber } = query;

  const dateFilter = {};
  if (month) {
    const [y, m] = month.split('-').map(Number);
    dateFilter.$gte = new Date(y, m - 1, 1);
    dateFilter.$lt  = new Date(y, m, 1);
  } else if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate)   dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const match = {};
  if (Object.keys(dateFilter).length) match.createdAt = dateFilter;
  if (factoryPlace)  match.factoryPlace  = factoryPlace;
  if (vehicleNumber) match.vehicleNumber = vehicleNumber.toUpperCase();
  return match;
}

// ── GET /api/admin/submissions ────────────────────────────────────
// FIXED: now accepts vehicleNumber, month, startDate, endDate filters
// so the mobile drill-down modal shows only the relevant trips
router.get('/submissions', adminMiddleware, async (req, res) => {
  try {
    const match = buildMatch(req.query);

    const submissions = await Submission.find(match)
      .populate('user', 'username mobileNumber')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/admin/dashboard/summary ─────────────────────────────
router.get('/dashboard/summary', adminMiddleware, async (req, res) => {
  try {
    const match = buildMatch(req.query);

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

    const perVehicle = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id:         '$vehicleNumber',
          username:    { $first: '$username' },
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const perFactory = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id:         '$factoryPlace',
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const perDay = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id:         { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

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

// ── GET /api/admin/dashboard/user/:userId ─────────────────────────
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
          _id:    { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
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

// ── GET /api/admin/dashboard/me (driver self-view, no adminMiddleware) ──
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
          _id:    { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
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

// ── GET /api/admin/dashboard/driver-summary ───────────────────────
// For drivers to view their OWN trip stats — uses authMiddleware (no admin needed)
// Filters by vehicleNumber stored on the logged-in user
router.get('/dashboard/driver-summary', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;

    // Get vehicleNumber from the logged-in user
    const User = require('../models/User');
    const user = await User.findById(req.user.id || req.user.userId).select('vehicleNumber username');
    if (!user || !user.vehicleNumber) {
      return res.status(400).json({ message: 'No vehicle number found for this user' });
    }

    const dateFilter = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      dateFilter.$gte = new Date(y, m - 1, 1);
      dateFilter.$lt  = new Date(y, m, 1);
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate)   dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const match = { vehicleNumber: user.vehicleNumber.toUpperCase() };
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
          _id:         { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalTrips:  { $sum: 1 },
          totalTons:   { $sum: '$numberOfTons' },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      summary: summary || {
        totalTrips: 0, totalTons: 0, totalAmount: 0,
        avgTonsPerTrip: 0, avgAmountPerTrip: 0,
      },
      perDay,
      vehicleNumber: user.vehicleNumber,
      username: user.username,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/admin/dashboard/driver-trips ─────────────────────────
// For drivers to view individual trips for a specific day
router.get('/dashboard/driver-trips', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date param required (YYYY-MM-DD)' });

    const User = require('../models/User');
    const user = await User.findById(req.user.id || req.user.userId).select('vehicleNumber');
    if (!user || !user.vehicleNumber) {
      return res.status(400).json({ message: 'No vehicle number found for this user' });
    }

    const start = new Date(date);
    const end   = new Date(date);
    end.setHours(23, 59, 59, 999);

    const trips = await Submission.find({
      vehicleNumber: user.vehicleNumber.toUpperCase(),
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });

    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;