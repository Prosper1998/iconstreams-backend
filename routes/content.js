const express = require('express');
const Content = require('../models/Content');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const s3 = require('../config/wasabi');

const router = express.Router();

// Get all content (Admin and Main frontend)
router.get('/', async (req, res) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new content (Admin only)
router.post('/', auth, adminAuth, upload, async (req, res) => {
  try {
    const { title, category, description, status, visibility, tags, publishDate, releaseYear, duration } = req.body;
    const files = req.files;

    let thumbnailUrl = '';
    let videoUrl = '';

    if (files?.thumbnail) {
      const thumbnail = files.thumbnail[0];
      const thumbnailData = await s3.upload({
        Bucket: process.env.WASABI_BUCKET,
        Key: `thumbnails/${Date.now()}-${thumbnail.originalname}`,
        Body: thumbnail.buffer,
        ContentType: thumbnail.mimetype,
      }).promise();
      thumbnailUrl = thumbnailData.Location;
    }

    if (files?.video) {
      const video = files.video[0];
      const videoData = await s3.upload({
        Bucket: process.env.WASABI_BUCKET,
        Key: `videos/${Date.now()}-${video.originalname}`,
        Body: video.buffer,
        ContentType: video.mimetype,
      }).promise();
      videoUrl = videoData.Location;
    }

    const content = new Content({
      title,
      category,
      description,
      thumbnail: thumbnailUrl,
      video: videoUrl,
      status,
      visibility,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      publishDate: publishDate || Date.now(),
      releaseYear,
      duration,
    });

    await content.save();
    return res.status(201).json({ message: 'Content uploaded successfully', content });
  } catch (error) {
    console.error('❌ Content Upload Error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});


// Update content (Admin only)
router.put('/:id', auth, adminAuth, upload, async (req, res) => {
  const { title, category, description, status, visibility, tags, publishDate, releaseYear, duration } = req.body;
  const files = req.files;

  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (files.thumbnail) {
      const thumbnail = files.thumbnail[0];
      const thumbnailParams = {
        Bucket: process.env.WASABI_BUCKET,
        Key: `thumbnails/${Date.now()}-${thumbnail.originalname}`,
        Body: thumbnail.buffer,
        ContentType: thumbnail.mimetype,
      };
      const thumbnailData = await s3.upload(thumbnailParams).promise();
      content.thumbnail = thumbnailData.Location;
    }

    if (files.video) {
      const video = files.video[0];
      const videoParams = {
        Bucket: process.env.WASABI_BUCKET,
        Key: `videos/${Date.now()}-${video.originalname}`,
        Body: video.buffer,
        ContentType: video.mimetype,
      };
      const videoData = await s3.upload(videoParams).promise();
      content.video = videoData.Location;
    }

    content.title = title || content.title;
    content.category = category || content.category;
    content.description = description || content.description;
    content.status = status || content.status;
    content.visibility = visibility || content.visibility;
    content.tags = tags ? tags.split(',').map(tag => tag.trim()) : content.tags;
    content.publishDate = publishDate || content.publishDate;
    content.releaseYear = releaseYear || content.releaseYear;
    content.duration = duration || content.duration;

    await content.save();
    res.json({ message: 'Content updated successfully', content });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete content (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    await content.remove();
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Increment views (Main frontend)
router.post('/:id/view', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.views += 1;
    await content.save();
    res.json({ message: 'View count incremented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage watchlist (Main frontend)
router.get('/watchlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.watchlist || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/watchlist', auth, async (req, res) => {
  const { contentId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (!user.watchlist) {
      user.watchlist = [];
    }

    if (user.watchlist.some(item => item.contentId.toString() === contentId)) {
      return res.status(400).json({ message: 'Content already in watchlist' });
    }

    user.watchlist.push({
      contentId: content._id,
      title: content.title,
      meta: `${content.releaseYear} • ${content.category} • ${content.duration}m`,
      image: content.thumbnail,
    });

    await user.save();
    res.json({ message: 'Added to watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/watchlist/:contentId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.watchlist = user.watchlist.filter(
      item => item.contentId.toString() !== req.params.contentId
    );
    await user.save();
    res.json({ message: 'Removed from watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
