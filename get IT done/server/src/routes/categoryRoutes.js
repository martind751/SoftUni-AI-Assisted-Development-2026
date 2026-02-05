const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Category } = require('../models/Category');

const categoryRouter = express.Router();

categoryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({ categories });
  })
);

categoryRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id).lean();
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ category });
  })
);

categoryRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await Category.create(req.body);
    res.status(201).json({ category: created });
  })
);

categoryRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ category: updated });
  })
);

categoryRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(204).send();
  })
);

module.exports = { categoryRouter };
