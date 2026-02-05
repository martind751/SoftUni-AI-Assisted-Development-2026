const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date },
    priority: { type: Number, default: 2, min: 1, max: 4 },
    status: {
      type: String,
      default: 'todo',
      enum: ['todo', 'in_progress', 'done']
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    isRecurring: { type: Boolean, default: false },
    recurrenceRule: { type: String, default: '' }
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task };
