'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Note extends Model {
    static associate({User}) {
      // define association here
      this.belongsTo(User, {foreignKey: 'userId'})
    }
  };
  Note.init({
    text: {
      // Текст заметки
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    sharedKey: {
      // Токен для расшареной заметки
      type: DataTypes.STRING
    },
    shared: {
      // Признак, что заметка расшарена
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Note',
    tableName: 'notes',
    timestamps: false
  });
  return Note;
};