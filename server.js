// Dependencies
const express = require("express");

// Sets up the Express App
const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path')

// Requiring our models for syncing
const db = require("./models");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static directory to be served
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

// Routes
require("./routes/rosters-api-routes.js")(app);
require("./routes/playerpools-api-routes.js")(app);
require("./routes/names-api-routes.js")(app);
require("./routes/standings-api-routes.js")(app);
require("./routes/startingrosters-api-routes.js")(app);
require("./routes/gamestates-api-routes.js")(app);

// Starts the server to begin listening
db.sequelize.sync({ force: false }).then(function () {
  app.listen(PORT, function () {
    console.log("App listening on PORT " + PORT);
  });
});