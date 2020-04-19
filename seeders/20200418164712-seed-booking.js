'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => { // eslint-disable-line no-unused-vars
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('People', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    return queryInterface.bulkInsert('Bookings', [{
      room: 'test1',
      position: 'A9',
      booker: '철수',
      simplePassword: '1234',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      room: 'test1',
      position: 'A11',
      booker: '영희',
      simplePassword: '4321',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      room: 'test1',
      position: 'B10',
      booker: '대원',
      simplePassword: '0000',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: (queryInterface, Sequelize) => { // eslint-disable-line no-unused-vars
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    return queryInterface.bulkDelete('Bookings', null, {});
  }
};
