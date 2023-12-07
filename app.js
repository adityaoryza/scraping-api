const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const helmet = require("helmet");
const kurs = require("./routes/kursRoutes");
const app = express();

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.google.com"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      fontSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  })
);
app.use(express.json());
app.use("", kurs);

const port = process.env.PORT || 7000;
const server = app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});

module.exports = app;
