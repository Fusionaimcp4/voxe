module.exports = {
  apps: [
    {
      name: "localboxs",
      script: "npm",
      args: "start",
      cwd: "/opt/localboxs-site",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_BASE_URL: "https://your-domain.com"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_BASE_URL: "https://your-domain.com"
      },
      // Logging
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      
      // Auto-restart configuration
      watch: false,
      ignore_watch: ["node_modules", "logs", ".git"],
      max_memory_restart: "1G",
      
      // Health monitoring
      min_uptime: "10s",
      max_restarts: 10,
      
      // Advanced PM2 features
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Environment-specific settings
      node_args: "--max-old-space-size=2048"
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: "deploy",
      host: "your-server.com",
      ref: "origin/main",
      repo: "https://github.com/localboxs/localboxs.git",
      path: "/opt/localboxs-site",
      "pre-deploy-local": "",
      "post-deploy": "npm install --production && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": ""
    }
  }
};
  