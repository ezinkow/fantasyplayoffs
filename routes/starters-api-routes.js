// Requiring our models
const { Starters } = require("../models");


module.exports = function (app) {

    // Get everything in Starters table
    app.get("/api/starters", function (req, res) {
        Starters.findAll({})
            .then(function (dbstarters) {
                res.json(dbstarters)
            })
    });

    // Post new starters to starters table
    app.post("/api/starters", function (req, res) {
        Starters.create({
            name: req.body.name,
            tier: req.body.tier,
            pick: req.body.pick
        })
            .then(function (dbstarters) {
                res.json(dbstarters)
            })
    });

    // Post updated starters to starters table
    app.put("/api/starters", function (req, res) {
        Starters.create({
            name: req.body.name,
            round: req.body.round,
            pick: req.body.pick,
            series_round: req.body.series_round,
            points: req.body.points,
            games: req.body.games
        })
            .then(function (dbstarters) {
                res.json(dbstarters)
            })
    });

    // Find starters where round = __
    app.get('/api/starters/:make_visible', function (req, res) {
        console.log('req params', req.params)
        Starters.findAll({
            where: {
                make_visible: req.params.make_visible
            }
        })
            .then(function (dbstarters) {
                res.json(dbstarters)
            })
        console.log(req.params)
    });

    // Find starters where set to visible
    app.get('/api/starters/:make_visible', function (req, res) {
        console.log('req params', req.params)
        Starters.findAll({
            where: {
                game_date: req.params.date
            }
        })
            .then(function (dbstarters) {
                res.json(dbstarters)
            })
        console.log(req.params)
    })

    // // Find starters where id = __
    // app.get('/api/starters/:id', function (req, res) {
    //     Starters.findAll({}
    //     )
    //         .then(function (dbstarters) {
    //             res.json(dbstarters)
    //         })
    //     console.log(req.params)
    // })



}