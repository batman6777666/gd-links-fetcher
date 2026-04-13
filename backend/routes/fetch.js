const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');

// Async wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/fetch-links
router.post('/fetch-links', asyncHandler(linkController.fetchLinks));

module.exports = router;
