const express = require('express');
const {
  getAllComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  updateComplaintStatus,
  addComment,
  getMyComplaints
} = require('../controllers/complaintController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// GET /api/complaints - Get all complaints (with filters)
router.get('/', getAllComplaints);

// GET /api/complaints/user/my-complaints - Get user's complaints
router.get('/user/my-complaints', getMyComplaints);

// GET /api/complaints/:id - Get single complaint
router.get('/:id', getComplaint);

// POST /api/complaints - Create new complaint
router.post('/', createComplaint);

// PUT /api/complaints/:id - Update complaint
router.put('/:id', updateComplaint);

// PUT /api/complaints/:id/status - Update complaint status
router.put('/:id/status', updateComplaintStatus);

// POST /api/complaints/:id/comment - Add comment to complaint
router.post('/:id/comment', addComment);

module.exports = router;