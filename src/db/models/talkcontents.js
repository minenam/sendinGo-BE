'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TalkContents extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Clients, {
        targetKey: 'clientId',
        foreignKey: 'clientId',
        onDelete: 'CASCADE',
      });
    }
  }
  TalkContents.init(
    {
      talkContentId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      clientId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'Clients',
          key: 'clientId',
        },
        onDelete: 'CASCADE',
      },
      organizationName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      region: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      regionDetail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentPrice: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deliveryCompany: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.fn('now'),
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.fn('now'),
      },
    },
    {
      sequelize,
      modelName: 'TalkContents',
    }
  );
  return TalkContents;
};
