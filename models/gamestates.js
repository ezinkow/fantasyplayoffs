module.exports = (sequelize, DataTypes) => {
    const GameStates = sequelize.define("GameStates", {
      current_round: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    });
  
    return GameStates;
  };
  