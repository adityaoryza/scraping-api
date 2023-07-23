const mongoose = require('mongoose');
require('dotenv').config();

//mongodb URI
// mongoose.connect(process.env.MONGODB_URI, {
mongoose.connect(
  'mongodb://127.0.0.1:27017/ScrapingApiDB?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.9.1',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = mongoose;
