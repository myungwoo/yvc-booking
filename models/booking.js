'use strict';
module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    room: DataTypes.STRING,
    position: DataTypes.STRING,
    booker: DataTypes.STRING,
    simplePassword: DataTypes.STRING
  }, {});
  Booking.associate = function(models) { // eslint-disable-line no-unused-vars
    // associations can be defined here
  };
  return Booking;
};