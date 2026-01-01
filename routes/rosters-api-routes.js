// Requiring our models
const { Rosters } = require("../models");


module.exports = function (app) {

    // Get everything in Rosters table
    app.get("/api/rosters", function (req, res) {
        Rosters.findAll({})
            .then(function (dbrosters) {
                res.json(dbrosters)
            })
    });

    // Post new rosters to rosters table
    app.post("/api/rosters", async (req, res) => {
        try {
            const data = Array.isArray(req.body) ? req.body : [req.body];

            const created = await Rosters.bulkCreate(
                data.map(row => ({
                    name: row.name,
                    player_name: row.player_name,
                    position: row.position,
                    team: row.team,
                    tier: row.tier
                }))
            );

            res.json(created);
        } catch (err) {
            console.error(err);
            res.status(500).json(err);
        }
    });

    // GET /api/rosters?name=elan&round=1
    app.get("/api/rosters/getmyroster", async (req, res) => {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ error: "Missing name" });
        }

        try {
            const roster = await Rosters.findAll({
                where: { name },
                order: [["id", "ASC"]], // optional, keeps insertion order
            });
            res.json(roster);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to fetch roster" });
        }
    });
}