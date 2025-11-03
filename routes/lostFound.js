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

// GET /api/lost-found/lost - Get all lost items (public)
router.get('/lost', getLostItems);

// GET /api/lost-found/found - Get all found items (public)
router.get('/found', getFoundItems);

// POST /api/lost-found/lost - Report lost item (protected)
router.post('/lost', auth, reportLost);

// POST /api/lost-found/found - Report found item (protected)
router.post('/found', auth, reportFound);

// PUT /api/lost-found/found/:id/claim - Claim found item (protected)
router.put('/found/:id/claim', auth, claimItem);

// GET /api/lost-found/matches - Get matching suggestions (public)
router.get('/matches', getMatches);

// GET /api/lost-found/user/my-items - Get user's lost/found items (protected)
router.get('/user/my-items', auth, getMyItems);

module.exports = router;