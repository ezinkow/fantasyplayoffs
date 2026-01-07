const { Rosters } = require("../models");

module.exports = function (app) {

  // ----------------------------------
  // GET all rosters (admin/debug)
  // ----------------------------------
  app.get("/api/rosters", async (req, res) => {
    try {
      const rows = await Rosters.findAll();
      res.json(rows);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  // ----------------------------------
  // GET roster by name (used for overwrite warning)
  // ----------------------------------
  app.get("/api/rosters/by-name/:name", async (req, res) => {
    try {
      const rows = await Rosters.findAll({
        where: { name: req.params.name },
        order: [["id", "ASC"]],
      });
      res.json(rows);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  app.get("/api/rosters/getmyroster", async (req, res) => {
    try {
      const { name } = req.query;
      if (!name) return res.status(400).json({ error: "Missing name parameter" });

      const rows = await Rosters.findAll({
        where: { name },
        order: [["id", "ASC"]],
      });

      // just return the data as an array
      res.json(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch user's roster" });
    }
  });
};

  // ----------------------------------
  // POST roster (OVERWRITE SAFE)
  // ----------------------------------
  app.post("/api/rosters", async (req, res) => {
    try {
      const data = Array.isArray(req.body) ? req.body : [req.body];
      const name = data[0]?.name;

      if (!name) {
        return res.status(400).json({ error: "Missing name" });
      }

      // 🔥 delete existing roster first
      await Rosters.destroy({ where: { name } });

      // insert new roster
      const created = await Rosters.bulkCreate(
        data.map(row => ({
          name: row.name,
          player_name: row.player_name,
          position: row.position,
          team: row.team,
          tier: row.tier,
        }))
      );

      res.json({ success: true, overwritten: true, created });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  });
};
