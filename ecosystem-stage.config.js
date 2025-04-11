require('dotenv').config();
// const packageJson = require('./package.json');

module.exports = {
  apps: [
    {
      // name: `stage-back@${packageJson.version}`,
      name: process.env.BACKEND_PM2_STAGE_NAME || 'dr-stage-back',
      script: './dist/api/index.js',
      exec_mode: process.env.BACKEND_PM2_STAGE_EXEC_MODE || 'cluster',
      instances: process.env.BACKEND_PM2_STAGE_INSTANCES || '1',
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.BACKEND_PM2_STAGE_MAX_MEMORY_RESTART || '1G',
      env: {
        NODE_ENV: "staging",
        BACKEND_PORT: parseInt(process.env.BACKEND_STAGE_PORT) || 5000,
      }
    }
  ]
}
