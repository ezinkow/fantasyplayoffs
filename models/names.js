module.exports = function (sequelize, DataTypes) {
    const Names = sequelize.define("Names", {
        real_name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        email_address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        phone: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        email_opt_in: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        paid_commitment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        paid: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    return Names;
};
