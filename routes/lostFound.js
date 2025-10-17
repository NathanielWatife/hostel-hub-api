const express = require('express');
const {
  getLostItems,
  getFoundItems,
  reportLostItem,
  reportFoundItem,
  claimFoundItem,
  getMatches
} = require('../controllers/lostFoundController');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

router.use(auth);

router.get('/lost', getLostItems);
router.get('/found', getFoundItems);
router.get('/matches', getMatches);

router.post('/lost', upload.array('images', 5), handleUploadError, reportLostItem);
router.post('/found', upload.array('images', 5), handleUploadError, reportFoundItem);
router.put('/found/:id/claim', claimFoundItem);

module.exports = router;