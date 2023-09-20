require('dotenv').config();
const packageJson = require('./package.json');

module.exports = {
  apps: [
    {
      name: `stage-back@${packageJson.version}`,
      script: './api/index.js',
      exec_mode: process.env.BACKEND_PM2_STAGE_EXEC_MODE,
      instances: process.env.BACKEND_PM2_STAGE_INSTANCES,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "production",
        BACKEND_PORT: parseInt(process.env.BACKEND_STAGE_PORT) || 5000,
      }
    }
  ]
}
