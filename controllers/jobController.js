const path = require('path');
const Job = require('../models/Jobs');
const geocoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/errorHandler');
const catchAsync = require('../middlewares/catchAsync');
const APIFilters = require('../utils/apiFilters');

// @desc  Get all jobs
// @route /api/v1/jobs
exports.getJobs = catchAsync(async (req, res, next) => {
  const apiFilters = new APIFilters(Job.find(), req.query)
    .filter()
    .sort()
    .limit()
    .searchByQuery()
    .paginate();
  const jobs = await apiFilters.query;

  return res.status(200).json({
    success: true,
    result: jobs.length,
    data: jobs,
  });
});

// @desc   Get a single job with id and slug
// @route  /api/v1/job/:id/:slug
exports.getJob = catchAsync(async (req, res, next) => {
  const job = await Job.find({
    $and: [{ _id: req.params.id }, { slug: req.params.slug }],
  });

  if (!job || job.length === 0) {
    return next(new ErrorHandler('Job not found', 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc  Create a new job
// @route /api/v1/job/new
exports.newJob = catchAsync(async (req, res, next) => {
  // Adding user to body
  req.body.user = req.user.id;

  const job = await Job.create(req.body);

  return res.status(200).json({
    success: true,
    message: 'Job Created',
    data: job,
  });
});

// @desc  Updating a job
// @route  /api/v1/job/:id
exports.updateJob = catchAsync(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler('Job not found', 404));
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
});

// @desc  Delete a job
// @route /api/v1/job/:id
exports.deleteJob = catchAsync(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler('Job not found', 404));
  }

  job = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Job is deleted',
  });
});

// @desc  Search jobs with radius
// @route /api/v1/jobs/:zipcode/:distance
exports.getJobsInRadius = catchAsync(async (req, res, next) => {
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
});

// @desc  Get stats about a topic(job)
// @route /api/v1/stats/:topic
exports.jobStats = catchAsync(async (req, res, next) => {
  try {
    const stats = await Job.aggregate([
      {
        $match: { $text: { $search: '"' + req.params.topic + '"' } },
      },
      {
        $group: {
          _id: { $toUpper: '$experience' },
          totalJobs: { $sum: 1 },
          avgPosition: { $avg: '$positions' },
          avgSalary: { $avg: '$salary' },
          minSalary: { $min: '$salary' },
          maxSalary: { $max: '$salary' },
        },
      },
    ]);

    if (stats.length === 0) {
      return next(
        new ErrorHandler(
          `No status found for - ${req.params.topic}`,
          200
        )
      );
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc  Apply to job using resume
// @route /api/v1/job/:id/apply
exports.applyJob = catchAsync(async (req, res, next) => {
  let job = await Job.findById(req.params.id).select(
    '+applicantsApplied'
  );

  if (!job) {
    return next(new ErrorHandler('Job not found.', 404));
  }

  // Check that if job last date has been passed or not
  if (job.lastDate < new Date(Date.now())) {
    return next(
      new ErrorHandler(
        'You can not apply to this job. Date is over.',
        400
      )
    );
  }

  // Check if user has applied before
  for (let i = 0; i < job.applicantsApplied.length; i++) {
    if (job.applicantsApplied[i].id === req.user.id) {
      return next(
        new ErrorHandler(
          'You have already applied for this job.',
          400
        )
      );
    }
  }

  // Check the files
  if (!req.files) {
    return next(new ErrorHandler('Please upload file.', 400));
  }

  const file = req.files.file;

  // Check file type
  const supportedFiles = /.docx|.pdf/;
  if (!supportedFiles.test(path.extname(file.name))) {
    return next(
      new ErrorHandler('Please upload document file.', 400)
    );
  }

  // Check doucument size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(
      new ErrorHandler('Please upload file less than 2MB.', 400)
    );
  }

  // Renaming resume
  file.name = `${req.user.name.replace(' ', '_')}_${job._id}${
    path.parse(file.name).ext
  }`;

  file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler('Resume upload failed.', 500));
    }

    await Job.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          applicantsApplied: {
            id: req.user.id,
            resume: file.name,
          },
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Applied to Job successfully.',
      data: file.name,
    });
  });
});
