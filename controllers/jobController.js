const Job = require('../models/Jobs');
const geocoder = require('../utils/geocoder');

// @desc  Get all jobs
// @route /api/v1/jobs
exports.getJobs = async (req, res, next) => {
  const jobs = await Job.find();

  return res.status(200).json({
    success: true,
    result: jobs.length,
    data: jobs,
  });
};

// @desc   Get a single job with id and slug
// @route  /api/v1/job/:id/:slug
exports.getJob = async (req, res, next) => {
  const job = await Job.find({
    $and: [{ _id: req.params.id }, { slug: req.params.slug }],
  });

  if (!job || job.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Job not found',
    });
  }

  res.status(200).json({
    success: true,
    data: job,
  });
};

// @desc  Create a new job
// @route /api/v1/job/new
exports.newJob = async (req, res, next) => {
  try {
    const job = await Job.create(req.body);

    return res.status(200).json({
      success: true,
      message: 'Job Created',
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

// @desc  Updating a job
// @route  /api/v1/job/:id
exports.updateJob = async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404).json({
      success: 'false',
      message: 'Job not found',
    });
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: 'Job is updated',
    data: job,
  });
};

// @desc  Delete a job
// @route /api/v1/job/:id
exports.deleteJob = async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404).json({
      success: 'false',
      message: 'Job not found',
    });
  }

  job = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Job is deleted',
  });
};

// @desc  Search jobs with radius
// @route /api/v1/jobs/:zipcode/:distance
exports.getJobsInRadius = async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Getting latitude and longitude from geocoder with zipcode
  const loc = await geocoder.geocode(zipcode);
  const latitude = loc[0].latitude;
  const longitude = loc[0].longitude;
  const radius = distance / 3963;

  const jobs = await Job.find({
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });

  return res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
};
