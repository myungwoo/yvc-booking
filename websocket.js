const WebSocket = require('ws');
const url = require('url');

const Rooms = require('./config/rooms');

module.exports = server => {
  const wss = new WebSocket.Server({ server });
  wss.roomClients = {'': new Set()};
  Rooms.roomInfo.forEach(room => {
    wss.roomClients[room.name] = new Set();
  });
  wss.broadcastHall = (room, availableSeatCount) => {
    wss.roomClients[''].forEach(ws => {
      ws.send(JSON.stringify({
        room,
        availableSeatCount,
      }));
    });
  };
  wss.broadcastRoom = (room, bookings) => {
    if (wss.roomClients[room] === undefined)
      return;
    wss.roomClients[room].forEach(ws => {
      ws.send(JSON.stringify(bookings));
    });
  };
  wss.on('connection', (ws, req) => {
    const pathname = url.parse(req.url).pathname;
    const res = /^\/ws\/(\w*)$/.exec(pathname);
    if (res === null) return ws.close();
    const room = res[1];
    if (wss.roomClients[room] === undefined) return ws.close();

    // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    wss.roomClients[room].add(ws);

    ws.on('close', () => {
      wss.roomClients[room].delete(ws);
    });
  });
  return wss;
};
