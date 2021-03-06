const router = require('express').Router();
const db = require('../models');
const Rooms = require('../config/rooms');
const moment = require('moment');

const removeBookingPasswordProperty = (booking) => {
  const { simplePassword, ...bookingWithoutPassword } = booking; // eslint-disable-line no-unused-vars
  return bookingWithoutPassword;
};

router.get('/server/info', (req, res) => {
  res.send({
    time: moment(),
  });
});

router.get('/rooms', async (req, res) => {
  const rooms = await Promise.all(Rooms.roomInfo.map(async room => (
    {...room, availableSeatCount: await room.availableSeatCount()}
  )));
  res.send(rooms);
});

router.get('/rooms/:name', async (req, res) => {
  const { name } = req.params;
  const room = Rooms.getRoom(name);
  if (room === undefined)
    return res.sendStatus(404);
  const bookings = (await db.Booking.findAll({ where: { room: name } })).map(e => removeBookingPasswordProperty(e.dataValues));
  const availableSeatCount = await room.availableSeatCount();
  res.send({ ...room, availableSeatCount, bookings});
});

router.get('/rooms/:name/:position', async (req, res) => {
  const { name, position } = req.params;
  const room  = Rooms.getRoom(name);
  if (room === undefined)
    return res.sendStatus(404);
  if (!room.isValidPosition(position))
    return res.sendStatus(404);
  const booking = await db.Booking.findOne({
    where: { room: name, position },
  });
  if (booking === null)
    return res.sendStatus(404);
  res.status(201).send(removeBookingPasswordProperty(booking.dataValues));
});

router.post('/rooms/:name/:position', async (req, res) => {
  const { name, position } = req.params;
  const { booker, simplePassword } = req.body;
  const { adminMode } = req.query;
  const room = Rooms.getRoom(name);
  if (room === undefined)
    return res.sendStatus(404);
  if (!room.isValidPosition(position))
    return res.sendStatus(404);
    
  const now = moment();
  // 예약 가능 시간에만 예약 가능하도록
  if (now < room.startTime && adminMode === undefined)
    return res.status(403).send({ reason: 'startTime' });
  if (now > room.endTime)
    return res.status(403).send({ reason: 'endTime' });
  if (booker === undefined || simplePassword === undefined)
    return res.sendStatus(400);
  const [booking, created] = await db.Booking.findOrCreate({
    where: { room: name, position },
    defaults: { booker, simplePassword },
  });
  // Booking이 이미 존재하면 403
  if (!created)
    return res.status(403).send({ reason: 'exists' });
  res.status(201).send(booking.dataValues);
  req.wss.broadcastRoom(name);
  req.wss.broadcastHall(name);
});

router.put('/rooms/:name/:position', async (req, res) => {
  const { name, position } = req.params;
  const { booker, simplePassword, newSimplePassword } = req.body;
  const { adminMode } = req.query;
  const room = Rooms.getRoom(name);
  if (room === undefined)
    return res.sendStatus(404);
  if (!room.isValidPosition(position))
    return res.sendStatus(404);
  const now = moment();
  // 예약 가능 시간에만 예약 가능하도록
  if (now < room.startTime && adminMode === undefined)
    return res.status(403).send({ reason: 'startTime' });
  if (now > room.endTime)
    return res.status(403).send({ reason: 'endTime' });
  if (booker === undefined || simplePassword === undefined)
    return res.sendStatus(400);
  const booking = await db.Booking.findOne({
    where: { room: name, position },
  });
  // Booking이 존재하지 않으면 404
  if (booking === null)
    return res.sendStatus(404);
  // Booking이 가지고 있는 비밀번호와 다른 경우 403
  if (booking.dataValues.simplePassword !== simplePassword)
    return res.status(403).send({ reason: 'password' });
  booking.booker = booker;
  if (newSimplePassword !== undefined)
    booking.simplePassword = newSimplePassword;
  await booking.save();
  res.send(booking.dataValues);
  req.wss.broadcastRoom(name);
});

router.delete('/rooms/:name/:position', async (req, res) => {
  const { name, position } = req.params;
  const { adminMode } = req.query;
  const room = Rooms.getRoom(name);
  if (room === undefined)
    return res.sendStatus(404);
  if (!room.isValidPosition(position))
    return res.sendStatus(404);

  const now = moment();
  // 예약 가능 시간에만 예약 가능하도록
  if (now < room.startTime && adminMode === undefined)
    return res.status(403).send({ reason: 'startTime' });
  if (now > room.endTime)
    return res.status(403).send({ reason: 'endTime' });
  const booking = await db.Booking.findOne({
    where: { room: name, position },
  });
  // Booking이 존재하지 않으면 404
  if (booking === null)
    return res.sendStatus(404);

  // Booking이 가지고 있는 비밀번호와 다른 경우 403
  const { authorization } = req.headers;
  if (authorization === undefined || !authorization.startsWith('SimplePassword ') || authorization.split(' ')[1] !== booking.dataValues.simplePassword)
    return res.status(403).send({ reason: 'password' });
  await booking.destroy();
  res.send(booking.dataValues);
  req.wss.broadcastRoom(name);
  req.wss.broadcastHall(name);
});

router.use('/', (req, res) => {
  res.sendStatus(404);
});

module.exports = router;
