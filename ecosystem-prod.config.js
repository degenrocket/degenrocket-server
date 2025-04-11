require('dotenv').config();
// const packageJson = require('./package.json');

module.exports = {
  apps: [
    {
      // name: `prod-back@${packageJson.version}`,
      name: process.env.BACKEND_PM2_PROD_NAME || 'dr-prod-back',
      script: './dist/api/index.js',
      exec_mode: process.env.BACKEND_PM2_PROD_EXEC_MODE || 'cluster',
      // The number of instances is currently set to '1' because
      // otherwise bree jobs to fetch RSS/SPASM will be called
      // multiple times on multiple CPU cores.
      // TODO: find a better solution, e.g. centralize the
      // fetching job to a single instance or a separate service.
      instances: process.env.BACKEND_PM2_PROD_INSTANCES || '1',
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.BACKEND_PM2_PROD_MAX_MEMORY_RESTART || '1G',
      env: {
        NODE_ENV: "production",
        BACKEND_PORT: parseInt(process.env.BACKEND_PROD_PORT) || 5000,
      }
    }
  ]
}
