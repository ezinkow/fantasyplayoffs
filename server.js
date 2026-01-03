// Dependencies
const express = require("express");
const cors = require("cors");
const path = require("path");

// Sets up the Express App
const app = express();
const PORT = process.env.PORT || 3001;

// Requiring our models for syncing
const db = require("./models");

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static React build (production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

// Routes
require("./routes/rosters-api-routes.js")(app);
require("./routes/playerpools-api-routes.js")(app);
require("./routes/names-api-routes.js")(app);
require("./routes/standings-api-routes.js")(app);
require("./routes/startingrosters-api-routes.js")(app);
require("./routes/gamestates-api-routes.js")(app);

// React Router fallback
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Start server
db.sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`App listening on PORT ${PORT}`);
  });
});