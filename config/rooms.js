const moment = require('moment');
const fs = require('fs');

const db = require('../models');

class Room {
  constructor(name, title, layout, startTime, endTime) {
    this.name = name;
    this.title = title;
    this.layout = layout;
    this.startTime = moment(startTime);
    this.endTime = moment(endTime);

    this.seatCount = 0;
    layout.forEach(row => {
      this.seatCount += (row.match(/[opj]/g) || []).length;
    });
  }

  async availableSeatCount() {
    return this.seatCount - (await db.Booking.count({ where: { room: this.name }}));
  }

  isValidPosition(position) {
    const res = /^([A-Z])(\d+)$/.exec(position);
    if (res === null) return false;
    let [r, c] = res.slice(1, 3);
    r = r.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    c = Number(c);
    const row = this.layout[r-1];
    if (row === undefined) return false;
    const val = row[c-1];
    if (!'opj'.includes(val)) return false;
    return true;
  }
}

class Rooms {
  constructor() {
    // config에서 room 정보 읽기
    this.roomInfo = require('../config/rooms.json').map(room => {
      const rows = fs.readFileSync(`./config/layouts/${room.layout}.txt`).toString().split('\n');
      const col = Math.max.apply(null, rows.map(e => e.length));
      const layout = rows.map(row => {
        // 사람의 실수로 줄 별로 칸 수가 통일 되지 않은 경우 뒤에 공백을 추가하여 맞춰준다
        if (row.length < col) row = row + ' '.repeat(col-row.length);
        return row;
      });
      return new Room(room.name, room.title, layout, room.startTime, room.endTime);
    });
  }

  getRoom(name) {
    return this.roomInfo.filter(e => e.name === name)[0];
  }
}

module.exports = new Rooms();
