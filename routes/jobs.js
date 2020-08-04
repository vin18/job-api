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
} = require('../controllers/jobController');

router.route('/jobs').get(getJobs);
router.route('/job/:id/:slug').get(getJob);
router.route('/jobs/:zipcode/:distance').get(getJobsInRadius);
router.route('/stats/:topic').get(jobStats);
router.route('/job/new').post(newJob);
router.route('/job/:id').put(updateJob).delete(deleteJob);

module.exports = router;
