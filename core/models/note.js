'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Note extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({User}) {
      // define association here
      this.belongsTo(User, {foreignKey: 'userId'})
    }
  };
  Note.init({
    text: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    sharedKey: {
      type: DataTypes.STRING
    },
    shared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Note',
    tableName: 'notes'
  });
  return Note;
};