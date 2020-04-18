const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.urlencoded({extended: false}));

app.use('/api', require('./api'));

if (process.env.NODE_ENV === 'production')
  app.use('/', express.static('client/build'));

process.on('unhandledRejection', error => {
  console.error('unhandledRejection', error.message); // eslint-disable-line no-console
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
