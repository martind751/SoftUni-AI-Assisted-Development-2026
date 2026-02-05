const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Tag } = require('../models/Tag');

const tagRouter = express.Router();

tagRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tags = await Tag.find().sort({ createdAt: -1 }).lean();
    res.json({ tags });
  })
);

tagRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await Tag.create(req.body);
    res.status(201).json({ tag: created });
  })
);

module.exports = { tagRouter };
