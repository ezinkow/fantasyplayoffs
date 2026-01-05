module.exports = (sequelize, DataTypes) => {
    const StartingRosters = sequelize.define(
        "StartingRosters",
        {
            name: DataTypes.STRING(100),
            round: DataTypes.INTEGER,
            player_name: DataTypes.TEXT,
            position: DataTypes.TEXT,
            team: DataTypes.TEXT,
            slot: DataTypes.TEXT,
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ["name", "round", "player_name"],
                },
            ],
        }
    );
    return StartingRosters;
};
