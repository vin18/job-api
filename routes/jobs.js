const express = require('express');
const router = express.Router();

// Importing jobs controller methods
const {
  getJobs,
  getJob,
  newJob,
  getJobsInRadius,
  updateJob,
  deleteJob,
  jobStats,
  applyJob,
} = require('../controllers/jobController');

const {
  isAuthenticatedUser,
  authorizeRoles,
} = require('../middlewares/auth');

router
  .route('/job/:id/apply')
  .put(isAuthenticatedUser, authorizeRoles('user'), applyJob);
router.route('/jobs').get(getJobs);
router.route('/job/:id/:slug').get(getJob);
router
  .route('/job/new')
  .post(
    isAuthenticatedUser,
    authorizeRoles('employeer', 'admin'),
    newJob
  );
router
  .route('/job/:id')
  .put(
    isAuthenticatedUser,
    authorizeRoles('employeer', 'admin'),
    updateJob
  )
  .delete(
    isAuthenticatedUser,
    authorizeRoles('employeer', 'admin'),
    deleteJob
  );
router.route('/jobs/:zipcode/:distance').get(getJobsInRadius);
router.route('/stats/:topic').get(jobStats);

module.exports = router;
