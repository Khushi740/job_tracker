const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      user: req.user._id
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      message: 'Job application added successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({ message: 'Server error creating job' });
  }
});

// @route   GET /api/jobs
// @desc    Get all jobs for the current user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id, isArchived: false }).sort({ dateApplied: -1 });

    res.json({
      message: 'Jobs retrieved successfully',
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get a specific job by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      message: 'Job retrieved successfully',
      job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error fetching job' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job by ID
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({ message: 'Server error updating job' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job by ID
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isArchived: true },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      message: 'Job archived successfully',
      job
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
});

module.exports = router;