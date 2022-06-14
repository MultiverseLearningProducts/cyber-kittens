const {sequelize} = require('./db');
const {Kitten} = require('./');
const {kittens} = require('./seedData');

const seed = async () => {
  await sequelize.sync({ force: true }); // recreate db
  await Kitten.bulkCreate(kittens);
};

module.exports = seed;
