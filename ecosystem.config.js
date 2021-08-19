// pm2 config file
// usages: pm2 start ecosystem.config.js --env production

module.exports = {
  apps : [{
    name: 'yvcbooking',
    script: 'server.js',
    instances: 1,
    exec_mode: 'cluster',
    wait_ready: true,
    listen_timeout: 50000,
    kill_timeout: 10000,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    watch: true
  }],
};
