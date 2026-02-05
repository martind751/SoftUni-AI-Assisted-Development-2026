const express = require('express');

const { healthRouter } = require('./healthRoutes');
const { taskRouter } = require('./taskRoutes');
const { projectRouter } = require('./projectRoutes');
const { goalRouter } = require('./goalRoutes');
const { tagRouter } = require('./tagRoutes');

const apiRouter = express.Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/goals', goalRouter);
apiRouter.use('/tags', tagRouter);

module.exports = { apiRouter };
