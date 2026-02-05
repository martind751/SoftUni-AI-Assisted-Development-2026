const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Task } = require('../models/Task');

const taskRouter = express.Router();

// Helper to build date range filters
function getViewModeFilter(view) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (view) {
    case 'today':
      return {
        status: { $ne: 'done' },
        dueDate: { $lte: endOfToday }
      };
    case 'upcoming':
      return {
        status: { $ne: 'done' },
        dueDate: { $gte: tomorrow }
      };
    case 'completed':
      return { status: 'done' };
    case 'active':
      return { status: { $ne: 'done' } };
    default:
      return {};
  }
}

// Allowed sort fields to prevent arbitrary field injection
const ALLOWED_SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'status'];

// Status sort order for meaningful ordering
const STATUS_ORDER = { todo: 1, in_progress: 2, done: 3 };

taskRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { view, projectId, categoryId, status, priority, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;
    
    // Build filter based on query params
    const filter = { ...getViewModeFilter(view) };
    
    if (projectId) filter.projectId = projectId;
    if (categoryId) filter.categoryId = categoryId;
    
    // Additional filters for status and priority
    if (status && !view) {
      // Only apply status filter if no view mode is set (view modes already filter by status)
      filter.status = status;
    }
    if (priority) {
      filter.priority = Number(priority);
    }
    
    // Search filter for title and description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Build sort object
    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    let tasks = await Task.find(filter)
      .populate('projectId', 'name')
      .populate('categoryId', 'name color')
      .sort(sort)
      .lean();
    
    // Special handling for status sort - use custom order
    if (sortField === 'status') {
      tasks = tasks.sort((a, b) => {
        const orderA = STATUS_ORDER[a.status] || 99;
        const orderB = STATUS_ORDER[b.status] || 99;
        return sortDirection === 1 ? orderA - orderB : orderB - orderA;
      });
    }
    
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
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('categoryId', 'name color')
      .lean();
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
