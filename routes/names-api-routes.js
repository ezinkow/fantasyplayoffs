// Requiring our models
const db = require("../models");

module.exports = function (app) {

    // Get everything in Names table
    app.get("/api/names", async (req, res) => {
        try {
            const names = await db.Names.findAll();
            res.json(names);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    });

    // Find names where name = __
    app.get('/api/names/:name', async (req, res) => {
        try {
            const names = await db.Names.findAll({
                where: { name: req.params.name }
            });
            res.json(names);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    });

    // Submit name
    app.post("/api/names", async (req, res) => {
        try {
            const newUser = await db.Names.create({
                real_name: req.body.real_name,
                name: req.body.name,
                password: req.body.password,
                email_address: req.body.email_address,
                phone: req.body.phone,
                email_opt_in: req.body.email_opt_in,
                paid_commitment: req.body.paid
            });
            res.json(newUser);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    });

    // Verify password
    app.post("/api/names/verify", async (req, res) => {
        const { name, password } = req.body;
        try {
            const user = await db.Names.findOne({ where: { name } });

            if (!user) return res.status(404).json({ success: false });
            if (user.password !== password) return res.status(401).json({ success: false });

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false });
        }
    });
};
