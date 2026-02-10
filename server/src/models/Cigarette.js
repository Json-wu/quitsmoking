const mongoose = require('mongoose');

const CigaretteSchema = new mongoose.Schema(
  {
    openid: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD

    puffCount: { type: Number, default: 0 },
    shakeCount: { type: Number, default: 0 },
    lightCount: { type: Number, default: 0 },

    // legacy
    newCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

CigaretteSchema.index({ openid: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Cigarette', CigaretteSchema);
