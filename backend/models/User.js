const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  set: { type: Number, enum: [1, 2], default: 1 }, // Set 1 or Set 2
  status: {
    type: String,
    enum: ['registered', 'round1_qualified', 'phase1_qualified', 'winner', 'eliminated'],
    default: 'registered'
  },
  currentScore: { type: Number, default: 0 }, // Transient score for current round
  tabSwitches: { type: Number, default: 0 } // Track tab switches
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
