const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Project } = require('../models/Project');

const projectRouter = express.Router();

projectRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    res.json({ projects });
  })
);

projectRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await Project.create(req.body);
    res.status(201).json({ project: created });
  })
);

module.exports = { projectRouter };
