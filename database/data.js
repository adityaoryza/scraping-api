const mongoose = require("./db");

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

dataSchema.statics.findRecordsByDate = async function (startdate, enddate) {
  try {
    const records = await this.find({
      date: { $gte: startdate, $lte: enddate },
    });
    return records;
  } catch (error) {
    throw error;
  }
};

const Data = mongoose.model("Data", dataSchema);

module.exports = Data;
