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

projectRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ project });
  })
);

projectRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ project: updated });
  })
);

projectRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(204).send();
  })
);

module.exports = { projectRouter };
