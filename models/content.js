const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  video: { type: String, required: true },
  status: { type: String, enum: ['published', 'draft', 'pending'], default: 'draft' },
  visibility: { type: String, enum: ['public', 'premium', 'private'], default: 'public' },
  tags: [String],
  publishDate: { type: Date, default: Date.now },
  releaseYear: { type: Number },
  duration: { type: Number },
  views: { type: Number, default: 0 },
});

module.exports = mongoose.model('Content', contentSchema);
