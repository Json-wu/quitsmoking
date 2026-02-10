const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    openid: { type: String, required: true, index: true },
    badgeType: { type: String, required: true },
    badgeName: { type: String, default: '' },
    days: { type: Number, default: 0 },
    icon: { type: String, default: '' },
    description: { type: String, default: '' },
    unlockTime: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

BadgeSchema.index({ openid: 1, badgeType: 1 }, { unique: true });

module.exports = mongoose.model('Badge', BadgeSchema);
