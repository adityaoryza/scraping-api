const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const Data = require("../database/data");

const app = express();
const port = 7000;

app.use(express.json());

app.get("/api/indexing", async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split("T")[0];
    const existingData = await Data.findOne({ date: currentDate });

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

    await Data.insertMany(kursData);

    res.status(200).json({ message: "Scraping and indexing completed" });
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: "Scraping and indexing failed" });
  }
});

app.delete("/api/kurs/:date", async (req, res) => {
  const { date } = req.params;

  try {
    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
      // Invalid date format
      res.status(500).json({ error: "Invalid date format" });
      return;
    }

    const existingRecords = await Data.find({ date });

    if (existingRecords.length === 0) {
      // No records found for the specified date
      res.status(404).json({ error: `No records found for date: ${date}` });
      return;
    }

    await Data.deleteMany({ date });

    res.status(200).json({ message: `Deleted records for date: ${date}` });
  } catch (error) {
    console.error("Error deleting records:", error);
    res.status(500).json({ error: "Failed to delete records" });
  }
});

app.get("/api/kurs", async (req, res) => {
  const { startdate, enddate } = req.query;

  try {
    if (
      !moment(startdate, "YYYY-MM-DD", true).isValid() ||
      !moment(enddate, "YYYY-MM-DD", true).isValid()
    ) {
      // Invalid date format
      res.status(500).json({ error: "Invalid date format" });
      return;
    }

    const records = await Data.findRecordsByDate(startdate, enddate);

    if (records.length === 0) {
      // No records found for the specified date range
      res
        .status(404)
        .json({ error: "No records found for the specified date range" });
      return;
    }

    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

app.get("/api/kurs/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { startdate, enddate } = req.query;

  // Validate the startdate and enddate using Moment.js
  const isValidDate = (dateString) =>
    moment(dateString, "YYYY-MM-DD", true).isValid();

  if (!isValidDate(startdate) || !isValidDate(enddate)) {
    res.status(500).json({ error: "Invalid startdate or enddate" });
    return;
  }

  try {
    const records = await Data.find({
      symbol,
      date: { $gte: startdate, $lte: enddate },
    });

    if (records.length === 0) {
      // No records found for the specified symbol and date range
      res.status(404).json({
        error: "No records found for the specified symbol and date range",
      });
      return;
    }

    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

app.post("/api/kurs", async (req, res) => {
  const kursData = req.body;

  // Check if the required fields are present in the kursData
  if (
    !kursData.symbol ||
    !kursData.date ||
    !kursData.e_rate ||
    !kursData.tt_counter ||
    !kursData.bank_notes
  ) {
    res.status(400).json({
      error:
        "Incomplete data. Please provide symbol, date, value, e_rate, tt_counter, and bank_notes fields",
    });
    return;
  }

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

    res
      .status(200)
      .json({ message: "Data successfully inserted", data: kursData });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Failed to insert data" });
  }
});

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

    res
      .status(200)
      .json({ message: "Data successfully updated", data: updatedRecord });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ error: "Failed to update data" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
