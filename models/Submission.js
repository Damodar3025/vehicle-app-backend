const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    vehicleNumber: { type: String, required: true, uppercase: true },
    numberOfTons: { type: Number, required: true },
    amount: { type: Number, required: true },
    factoryPlace: {
      type: String,
      required: true,
      enum: ['NSL Sugars Mandya', 'Mylar sugars Hoovina Hadagali', 'Mudhol'],
    },
    smsSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
