const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // adjust path to your sequelize instance

const StartingRosters = sequelize.define(
  "StartingRosters",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100), // changed from TEXT → STRING(100)
      allowNull: false,
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    player_name: {
      type: DataTypes.STRING(100), // changed from TEXT → STRING(100)
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    team: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    slot: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["name", "round", "player_name"], // MySQL now allows this because name is VARCHAR
        name: "starting_rosters_name_round_player_name",
      },
    ],
    timestamps: false, // keep your original settings
  }
);

module.exports = StartingRosters;
