const http = require('node:http');
const { createApp } = require('./app');
const { connectDb } = require('./config/db');
const { env } = require('./config/env');

async function createServer() {
  try {
    await connectDb();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to MongoDB. Check MONGODB_URI and that MongoDB is running.');
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
    return null;
  }

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${env.PORT}`);
  });

  return server;
}

module.exports = { createServer };
