require('dotenv').config();
// const packageJson = require('./package.json');

module.exports = {
  apps: [
    {
      // name: `stage-back@${packageJson.version}`,
      name: 'dr-stage-back',
      script: './api/index.js',
      exec_mode: process.env.BACKEND_PM2_STAGE_EXEC_MODE || 'cluster',
      instances: process.env.BACKEND_PM2_STAGE_INSTANCES || '1',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "staging",
        BACKEND_PORT: parseInt(process.env.BACKEND_STAGE_PORT) || 5000,
      }
    }
  ]
}
