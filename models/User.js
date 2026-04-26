const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    vehicleNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    vehicleType: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
