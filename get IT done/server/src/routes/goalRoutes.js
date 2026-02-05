const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Goal } = require('../models/Goal');

const goalRouter = express.Router();

goalRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const goals = await Goal.find().sort({ createdAt: -1 }).lean();
    res.json({ goals });
  })
);

goalRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await Goal.create(req.body);
    res.status(201).json({ goal: created });
  })
);

goalRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id).lean();
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ goal });
  })
);

goalRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ goal: updated });
  })
);

goalRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Goal.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(204).send();
  })
);

module.exports = { goalRouter };
