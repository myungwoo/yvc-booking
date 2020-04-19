const WebSocket = require('ws');
const url = require('url');

const Rooms = require('./config/rooms');

module.exports = server => {
  const wss = new WebSocket.Server({ server });
  wss.roomClients = {};
  Rooms.roomInfo.forEach(room => {
    wss.roomClients[room.name] = new Set();
  });
  wss.broadcastRoom = (room, obj) => {
    if (wss.roomClients[room] === undefined)
      return;
    wss.roomClients[room].forEach(ws => {
      ws.send(JSON.stringify(obj));
    });
  };
  wss.on('connection', (ws, req) => {
    const pathname = url.parse(req.url).pathname;
    const room = pathname.slice(1);

    // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    wss.roomClients[room].add(ws);

    ws.on('close', () => {
      wss.roomClients[room].delete(ws);
    });
  });
  return wss;
};
