module.exports = function (sequelize, DataTypes) {
    const Rosters = sequelize.define("Rosters", {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        player_name: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        position: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        team: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tier: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    });

    return Rosters;
};
