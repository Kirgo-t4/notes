'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate({Note}) {
      this.hasMany(Note, {foreignKey: 'userId', onDelete: 'CASCADE'})
    }
  };
  User.init({
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {msg: "login cannot be empty"}
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastToken: {
      // Последний номер выданного jwt токена (номера увеличиваются на 1)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Номер последнего валидного токена (все номера меньше него невалидны)
    validTokenNumber: DataTypes.INTEGER
  }, {
    sequelize,
    tableName: 'users',
    modelName: 'User',
  });
  return User;
};