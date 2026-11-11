module.exports = {
  apps: [
    {
      name: 'cellfocus-api',
      cwd: './server',
      script: 'server.js',
      instances: 1, // Single worker maintains stable Baileys Multi-Device WhatsApp socket
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 200,
      restart_delay: 2000,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '../logs/pm2-error.log',
      out_file: '../logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};

