const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Task } = require('../models/Task');

const taskRouter = express.Router();

taskRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    res.json({ tasks });
  })
);

taskRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await Task.create(req.body);
    res.status(201).json({ task: created });
  })
);

taskRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ error: { message: 'Task not found' } });
    res.json({ task });
  })
);

taskRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    }).lean();
    if (!updated) return res.status(404).json({ error: { message: 'Task not found' } });
    res.json({ task: updated });
  })
);

taskRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Task.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: { message: 'Task not found' } });
    res.status(204).send();
  })
);

module.exports = { taskRouter };
