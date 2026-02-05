const express = require('express');

const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  res.json({
    ok: true,
    name: 'get IT done',
    time: new Date().toISOString()
  });
});

module.exports = { healthRouter };
