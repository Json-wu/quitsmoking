const mongoose = require('mongoose');

const ShareSchema = new mongoose.Schema(
  {
    openid: { type: String, required: true, index: true },
    date: { type: String, required: true },
    shareCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Share', ShareSchema);
