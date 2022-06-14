const {Sequelize, sequelize} = require('./db');

const Kitten = sequelize.define('kitten', {
  name: Sequelize.STRING,
  color: Sequelize.STRING,
  age: Sequelize.INTEGER
});

module.exports = { Kitten };
