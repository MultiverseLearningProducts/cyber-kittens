const {Kitten} = require('./Kitten');
const {User} = require('./User');
const {sequelize, Sequelize} = require('./db');

Kitten.belongsTo(User, {foreignKey: 'ownerId'}); // Kitten table, there will be an ownerId <- FK
User.hasMany(Kitten);

module.exports = {
    Kitten,
    User,
    sequelize,
    Sequelize
};
