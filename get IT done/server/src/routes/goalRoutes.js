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

module.exports = { goalRouter };
