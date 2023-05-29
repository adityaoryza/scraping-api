const express = require("express");
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = 7000;

app.use(express.json());

// mongoose configuration
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dataSchema = new mongoose.Schema({
  symbol: String,
  e_rate: {
    jual: Number,
    beli: Number,
  },
  tt_counter: {
    jual: Number,
    beli: Number,
  },
  bank_notes: {
    jual: Number,
    beli: Number,
  },
  date: Date,
});

const Data = mongoose.model("Data", dataSchema);

// note add new data if its needs
// const newData = new Data({
//   symbol: "USD",
//   e_rate: {
//     jual: 1803.55,
//     beli: 177355,
//   },
//   tt_counter: {
//     jual: 1803.55,
//     beli: 177355,
//   },
//   bank_notes: {
//     jual: 1803.55,
//     beli: 177355,
//   },
//   date: new Date("2003-05-22"),
// });

// newData.save().then(
//   () => console.log("One entry added"),
//   (err) => console.log(err)
// );

// note : this route is completed
app.get("/api/indexing", async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in "yyyy-mm-dd" format
    console.log("Current Date :", currentDate);

    // Check if there is already data for the current date in the database
    const existingData = await Data.findOne({ date: currentDate });
    console.log("Existing data : ", existingData);

    if (existingData) {
      // Data already exists for the current date, no need to scrape again
      res.json({ message: "Data for the current date already exists" });
      return;
    }

    const url = "https://www.bca.co.id/id/informasi/kurs";
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const kursTable = $(".m-table-kurs");
    const kursData = [];

    $("tbody tr", kursTable).each((index, row) => {
      const columns = $(row).find("td");
      const symbol = $(columns[0]).text().trim();
      const eRateBeli = parseFloat(
        $(columns[1]).text().trim().replace(/\./g, "").replace(",", ".")
      );
      const eRateJual = parseFloat(
        $(columns[2]).text().trim().replace(/\./g, "").replace(",", ".")
      );
      const ttCounterBeli = parseFloat(
        $(columns[3]).text().trim().replace(/\./g, "").replace(",", ".")
      );
      const ttCounterJual = parseFloat(
        $(columns[4]).text().trim().replace(/\./g, "").replace(",", ".")
      );
      const bankNotesBeli = parseFloat(
        $(columns[5]).text().trim().replace(/\./g, "").replace(",", ".")
      );
      const bankNotesJual = parseFloat(
        $(columns[6]).text().trim().replace(/\./g, "").replace(",", ".")
      );

      const kurs = {
        symbol,
        e_rate: {
          jual: eRateJual,
          beli: eRateBeli,
        },
        tt_counter: {
          jual: ttCounterJual,
          beli: ttCounterBeli,
        },
        bank_notes: {
          jual: bankNotesJual,
          beli: bankNotesBeli,
        },
        date: new Date(currentDate), // Convert the date string to a Date object
      };
      kursData.push(kurs);
    });

    // Store the kurs data in the database
    await Data.insertMany(kursData);

    res.json({ message: "Scraping and indexing completed" });
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: "Scraping and indexing failed" });
  }
});

// note this route is completed
app.delete("/api/kurs/:date", async (req, res) => {
  const { date } = req.params;

  try {
    await Data.deleteMany({ date });

    res.json({ message: `Deleted records for date: ${date}` });
  } catch (error) {
    console.error("Error deleting records:", error);
    res.status(500).json({ error: "Failed to delete records" });
  }
});

// note this routes is completed
app.get("/api/kurs", async (req, res) => {
  const { startdate, enddate } = req.query;

  try {
    const records = await Data.find({
      date: { $gte: startdate, $lte: enddate },
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// note this routes is completed
// GET SPECIFIC SYMBOL IN SPECIFIC RANGES OF DATES
app.get("/api/kurs/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { startdate, enddate } = req.query;

  try {
    const records = await Data.find({
      symbol,
      date: { $gte: startdate, $lte: enddate },
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// note this routes completed
app.post("/api/kurs", async (req, res) => {
  const kursData = req.body;

  try {
    const existingRecord = await Data.findOne({
      symbol: kursData.symbol,
      date: kursData.date,
    });

    if (existingRecord) {
      res.status(409).json({ error: "Data already exists" });
      return;
    }

    await Data.create(kursData);

    res.json({ message: "Data successfully inserted", data: kursData });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Failed to insert data" });
  }
});

// note this routes is completed
app.put("/api/kurs", async (req, res) => {
  const kursData = req.body;

  try {
    const existingRecord = await Data.findOne({
      symbol: kursData.symbol,
      date: kursData.date,
    });

    if (!existingRecord) {
      res.status(404).json({ error: "Data not found" });
      return;
    }

    const updatedRecord = await Data.findOneAndUpdate(
      { symbol: kursData.symbol, date: kursData.date },
      kursData,
      { new: true } // Returns the updated document instead of the original document
    );

    res.json({ message: "Data successfully updated", data: updatedRecord });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ error: "Failed to update data" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
