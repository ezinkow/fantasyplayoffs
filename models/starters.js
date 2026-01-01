module.exports = function (sequelize, DataTypes) {
    const Starters = sequelize.define("Starters", {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        round: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        position: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tier: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        pick: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    });

    return Starters;
};
