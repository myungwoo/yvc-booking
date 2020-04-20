// pm2 config file
// usages: pm2 start ecosystem.config.js --env production

module.exports = {
  apps : [{
    name: 'yvcbooking',
    script: 'server.js',
    watch: '.',
    ignore_watch : ['node_modules', '*.sqlite3', '*.sqlite3-journal', 'client', '.git'],
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }],
};