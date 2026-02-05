const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const env = {
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/get-it-done'
};

module.exports = { env };
