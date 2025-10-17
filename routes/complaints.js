const express = require('express');
const {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  updateComplaintStatus,
  addComment,
  getMyComplaints
} = require('../controllers/complaintController');
const { auth, staffAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getComplaints)
  .post(upload.array('images', 5), handleUploadError, createComplaint);

router.get('/user/my-complaints', getMyComplaints);

router.route('/:id')
  .get(getComplaint)
  .put(updateComplaint);

router.put('/:id/status', staffAuth, updateComplaintStatus);
router.post('/:id/comment', addComment);

module.exports = router;