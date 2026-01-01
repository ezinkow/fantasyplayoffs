// Requiring our models
const { PlayerPools } = require("../models");


module.exports = function (app) {

    // Get everything in PlayerPools table
    app.get("/api/playerPools", function (req, res) {
        PlayerPools.findAll({})
            .then(function (dbplayerPools) {
                res.json(dbplayerPools)
            })
    });

    // Find playerPools where set to visible
    app.get('/api/playerPools/:make_visible', function (req, res) {
        console.log('req params', req.params)
        PlayerPools.findAll({
            where: {
                game_date: req.params.date
            }
        })
            .then(function (dbplayerPools) {
                res.json(dbplayerPools)
            })
        console.log(req.params)
    })
}