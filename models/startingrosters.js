module.exports = (sequelize, DataTypes) => {
    const StartingRosters = sequelize.define("StartingRosters", {
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        round: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        player_name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        position: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        team: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        slot: {
            // LINEUP SLOT (QB / RB / WR / SUPERFLEX)
            type: DataTypes.TEXT,
            allowNull: false,
        }
    });

    return StartingRosters;
};
