const WebSocket = require('ws');
const url = require('url');

const Rooms = require('./config/rooms');
const db = require('./models');

const removeBookingPasswordProperty = (booking) => {
  const { simplePassword, ...bookingWithoutPassword } = booking; // eslint-disable-line no-unused-vars
  return bookingWithoutPassword;
};

module.exports = server => {
  const wss = new WebSocket.Server({ server });
  wss.roomClients = {'': new Set()};
  Rooms.roomInfo.forEach(room => {
    wss.roomClients[room.name] = new Set();
  });
  wss.broadcastHall = async (name) => {
    const room = Rooms.getRoom(name);
    if (wss.roomClients[''] === undefined || room === undefined)
      return;
    const availableSeatCount = await room.availableSeatCount();
    wss.roomClients[''].forEach(ws => {
      ws.send(JSON.stringify({
        room: name,
        availableSeatCount,
      }));
    });
  };
  wss.broadcastRoom = async (name) => {
    const room = Rooms.getRoom(name);
    if (wss.roomClients[name] === undefined || room === undefined)
      return;
    const bookings = (await db.Booking.findAll({ where: { room: name } })).map(e => removeBookingPasswordProperty(e.dataValues));
    wss.roomClients[name].forEach(ws => {
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
