const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    openid: { type: String, required: true, unique: true, index: true },
    nickName: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    quitDate: { type: String, default: '' },
    dailyCigarettes: { type: Number, default: 20 },
    cigarettesPerPack: { type: Number, default: 20 },
    cigarettePrice: { type: Number, default: 15 },

    makeUpCount: { type: Number, default: 3 },
    lastMakeUpResetMonth: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
