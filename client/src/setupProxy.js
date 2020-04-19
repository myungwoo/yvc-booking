const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(createProxyMiddleware('/api', { target: 'http://127.0.0.1:3001' }));
  app.use(createProxyMiddleware('/ws', { target: 'ws://127.0.0.1:3001', ws: true }));
};
