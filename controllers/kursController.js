const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const Data = require("../models/data");

exports.welcome = async (req, res, next) => {
  return res.json({
    message: "Welcome to this API",
  });
};

exports.Indexing = async (req, res, next) => {
  try {
    const currentDate = new Date().toISOString().split("T")[0];
    const existingData = await Data.findOne({ date: currentDate });

    if (existingData) {
      res.json({ message: "Data for the current date already exists" });
      return;
    }

    const url = "https://www.bca.co.id/id/informasi/kurs";
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const kursTable = $(".m-table-kurs");
    const kursData = [];

    const parseRow = (row) => {
      const columns = $(row).find("td");
      const symbol = $(columns[0]).text().trim();
      const parseColumn = (index) =>
        parseFloat(
          $(columns[index]).text().trim().replace(/\./g, "").replace(",", ".")
        );

      const kurs = {
        symbol,
        e_rate: {
          jual: parseColumn(2),
          beli: parseColumn(1),
        },
        tt_counter: {
          jual: parseColumn(4),
          beli: parseColumn(3),
        },
        bank_notes: {
          jual: parseColumn(6),
          beli: parseColumn(5),
        },
        date: new Date(currentDate),
      };
      kursData.push(kurs);
    };

    $("tbody tr", kursTable).each((index, row) => {
      parseRow(row);
    });

    // Use Promise.all to parallelize database insertion
    await Promise.all(kursData.map((data) => Data.create(data)));

    res.status(200).json({ message: "Scraping and indexing completed" });
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: "Scraping and indexing failed" });
  }
};

exports.deleteData = async (req, res, next) => {
  try {
    const { date } = req.params;

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
};

exports.getAll = async (req, res, next) => {
  try {
    const { startdate, enddate } = req.query;

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
};

exports.getBySymbol = async (req, res, next) => {
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
};

exports.createNewData = async (req, res, next) => {
  try {
    const kursData = req.body;

    // Log the received data for debugging
    console.log("Received Data:", kursData);

    if (
      !kursData ||
      !kursData.symbol ||
      !kursData.date ||
      !kursData.e_rate ||
      !kursData.tt_counter ||
      !kursData.bank_notes
    ) {
      return res.status(400).json({
        error:
          "Incomplete data. Please provide symbol, date, e_rate, tt_counter, and bank_notes fields",
      });
    }

    const existingRecord = await Data.findOne({
      symbol: kursData.symbol,
      date: kursData.date,
    });

    if (existingRecord) {
      return res.status(409).json({ error: "Data already exists" });
    }

    await Data.create(kursData);

    return res.status(200).json({
      message: "Data successfully inserted",
      data: kursData,
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    return res.status(500).json({ error: "Failed to insert data" });
  }
};

exports.updateData = async (req, res, next) => {
  try {
    const kursData = req.body;

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
      { new: true }
    );

    res.status(200).json({
      message: "Data successfully updated",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ error: "Failed to update data" });
  }
};
