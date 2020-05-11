const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('express-basic-auth');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = require('./websocket')(server);

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', (req, res, next) => {
  req.wss = wss;
  next();
});

app.use('/api', require('./api'));

if (process.env.NODE_ENV === 'production'){
  app.use('/', express.static('client/build'));
  app.use('/admin', basicAuth({
    users: {
      [process.env.USERNAME]: process.env.PASSWORD,
    },
    challenge: true,
  }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
  });
}

process.on('unhandledRejection', error => {
  console.error('unhandledRejection', error.message); // eslint-disable-line no-console
});

server.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
