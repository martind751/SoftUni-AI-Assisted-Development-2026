const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Task } = require('../models/Task');

const statsRouter = express.Router();

statsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all tasks for comprehensive stats
    const allTasks = await Task.find({})
      .populate('projectId', 'name')
      .populate('categoryId', 'name color')
      .lean();

    // Calculate basic counts
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const todoTasks = allTasks.filter(t => t.status === 'todo').length;

    // Calculate completion rate
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // Tasks by priority
    const tasksByPriority = {
      critical: allTasks.filter(t => t.priority === 1).length,
      high: allTasks.filter(t => t.priority === 2).length,
      medium: allTasks.filter(t => t.priority === 3).length,
      low: allTasks.filter(t => t.priority === 4).length
    };

    // Tasks by category
    const tasksByCategory = {};
    allTasks.forEach(task => {
      if (task.categoryId) {
        const categoryName = task.categoryId.name || 'Unknown';
        tasksByCategory[categoryName] = (tasksByCategory[categoryName] || 0) + 1;
      } else {
        tasksByCategory['Uncategorized'] = (tasksByCategory['Uncategorized'] || 0) + 1;
      }
    });

    // Tasks by project
    const tasksByProject = {};
    allTasks.forEach(task => {
      if (task.projectId) {
        const projectName = task.projectId.name || 'Unknown';
        tasksByProject[projectName] = (tasksByProject[projectName] || 0) + 1;
      } else {
        tasksByProject['No Project'] = (tasksByProject['No Project'] || 0) + 1;
      }
    });

    // Overdue tasks
    const overdueTasks = allTasks.filter(
      t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today
    ).length;

    // Due today
    const dueTodayTasks = allTasks.filter(
      t => t.status !== 'done' && t.dueDate && 
      new Date(t.dueDate) >= today && 
      new Date(t.dueDate) < new Date(today.getTime() + 86400000)
    ).length;

    // Completed in last 7 days
    const completedLast7Days = allTasks.filter(
      t => t.status === 'done' && t.updatedAt && new Date(t.updatedAt) >= sevenDaysAgo
    ).length;

    // Completed in last 30 days
    const completedLast30Days = allTasks.filter(
      t => t.status === 'done' && t.updatedAt && new Date(t.updatedAt) >= thirtyDaysAgo
    ).length;

    // Average tasks per day (last 7 days)
    const avgTasksPerDay = completedLast7Days > 0 
      ? (completedLast7Days / 7).toFixed(1)
      : 0;

    // Completion trend (last 7 days)
    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const completed = allTasks.filter(
        t => t.status === 'done' && 
        t.updatedAt && 
        new Date(t.updatedAt) >= date && 
        new Date(t.updatedAt) < nextDate
      ).length;

      completionTrend.push({
        date: date.toISOString().split('T')[0],
        count: completed
      });
    }

    const stats = {
      overview: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        completionRate,
        overdue: overdueTasks,
        dueToday: dueTodayTasks
      },
      productivity: {
        completedLast7Days,
        completedLast30Days,
        avgTasksPerDay: parseFloat(avgTasksPerDay)
      },
      distribution: {
        byPriority: tasksByPriority,
        byCategory: tasksByCategory,
        byProject: tasksByProject
      },
      trend: completionTrend
    };

    res.json({ stats });
  })
);

module.exports = { statsRouter };
