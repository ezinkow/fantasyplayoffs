module.exports = function (sequelize, DataTypes) {
    const PlayerPools = sequelize.define("PlayerPools", {
        player_name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        team: {
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
        eliminated: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        wild_card_score: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        divisional_score: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        conf_championship_score: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        super_bowl_score: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
        // ,
        // total_score: {
        //     type: DataTypes.VIRTUAL, // Virtual field
        //     get() {
        //         const wildCardScore = parseFloat(this.getDataValue('wild_card_score')) || 0;
        //         const divisionalScore = parseFloat(this.getDataValue('divisional_score')) || 0;
        //         const confChampionshipScore = parseFloat(this.getDataValue('conf_championship_score')) || 0;
        //         const SuperBowlScore = parseFloat(this.getDataValue('super_bowl_score')) || 0;
        //         return wildCardScore + divisionalScore + confChampionshipScore + SuperBowlScore;
        //     },
        // },

    });

    return PlayerPools;
};
