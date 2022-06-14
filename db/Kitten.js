const {Sequelize, sequelize} = require('./db');

const Kitten = sequelize.define('kitten', {
  username: Sequelize.STRING,
  password: Sequelize.STRING
});

module.exports = { Kitten };
