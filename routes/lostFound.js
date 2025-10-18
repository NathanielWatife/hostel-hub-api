const express = require('express');
const {
  getLostItems,
  getFoundItems,
  reportLost,
  reportFound,
  claimItem,
  getMatches,
  getMyItems
} = require('../controllers/lostFoundController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// GET /api/lost-found/lost - Get all lost items
router.get('/lost', getLostItems);

// GET /api/lost-found/found - Get all found items
router.get('/found', getFoundItems);

// POST /api/lost-found/lost - Report lost item
router.post('/lost', reportLost);

// POST /api/lost-found/found - Report found item
router.post('/found', reportFound);

// PUT /api/lost-found/found/:id/claim - Claim found item
router.put('/found/:id/claim', claimItem);

// GET /api/lost-found/matches - Get matching suggestions
router.get('/matches', getMatches);

// GET /api/lost-found/user/my-items - Get user's lost/found items
router.get('/user/my-items', getMyItems);

module.exports = router;