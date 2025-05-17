const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'pending', 'suspended', 'banned'], default: 'pending' },
  subscription: { type: String, enum: ['none', 'basic', 'premium'], default: 'none' },
  joinedDate: { type: Date, default: Date.now },
  watchlist: [
    {
      contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
      title: String,
      meta: String,
      image: String,
    },
  ],
});

module.exports = mongoose.model('User', userSchema);