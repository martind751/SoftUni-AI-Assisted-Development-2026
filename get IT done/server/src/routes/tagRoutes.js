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

tagRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const tag = await Tag.findById(req.params.id).lean();
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json({ tag });
  })
);

tagRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await Tag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json({ tag: updated });
  })
);

tagRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Tag.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.status(204).send();
  })
);

module.exports = { tagRouter };
