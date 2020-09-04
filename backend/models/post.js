'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      post.belongsTo(models.user, {
        foreignKey: 'userID',
        onDelete: 'CASCADE'
      })

      post.hasMany(models.comment, {
        foreignKey: 'postID'
      })
    }
  };
  post.init({
    contents: DataTypes.STRING,
    userID: DataTypes.INTEGER,
    score: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'post',
  });
  return post;
};