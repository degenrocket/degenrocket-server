require('dotenv').config();
const packageJson = require('./package.json');

module.exports = {
  apps: [
    {
      name: `prod-back@${packageJson.version}`,
      script: './api/index.js',
      exec_mode: process.env.BACKEND_PM2_PROD_EXEC_MODE || 'cluster',
      instances: process.env.BACKEND_PM2_PROD_INSTANCES || 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "production",
        BACKEND_PORT: parseInt(process.env.BACKEND_PROD_PORT) || 5000,
      }
    }
  ]
}
