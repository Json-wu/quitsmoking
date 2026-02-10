const mongoose = require('mongoose');

const CheckinSchema = new mongoose.Schema(
  {
    openid: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    timestamp: { type: Number, required: true, index: true },
    isMakeUp: { type: Boolean, default: false },
    continuousDays: { type: Number, default: 1 },
    totalDays: { type: Number, default: 1 }
  },
  { timestamps: true }
);

CheckinSchema.index({ openid: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Checkin', CheckinSchema);
