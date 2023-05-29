// note this is just a function that i use to scrap data from the website

const cheerio = require("cheerio");
const axios = require("axios");

const url = "https://www.bca.co.id/id/informasi/kurs";
async function getKursData() {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Find the element containing the kurs data
    const kursTable = $(".m-table-kurs");

    // Initialize an array to store the scraped data
    const kursData = [];

    // Iterate over each row in the table, starting from the second row
    $("tbody tr", kursTable).each((index, row) => {
      const columns = $(row).find("td");

      // Extract the relevant data from each column
      const mataUang = $(columns[0]).text().trim();
      const eRateBeli = $(columns[1]).text().trim();
      const eRateJual = $(columns[2]).text().trim();
      const ttCounterBeli = $(columns[3]).text().trim();
      const ttCounterJual = $(columns[4]).text().trim();
      const bankNotesBeli = $(columns[5]).text().trim();
      const bankNotesJual = $(columns[6]).text().trim();

      // Create an object representing the kurs data and add it to the array
      const kurs = {
        mataUang,
        eRate: {
          beli: eRateBeli,
          jual: eRateJual,
        },
        ttCounter: {
          beli: ttCounterBeli,
          jual: ttCounterJual,
        },
        bankNotes: {
          beli: bankNotesBeli,
          jual: bankNotesJual,
        },
      };
      kursData.push(kurs);
    });

    console.log(kursData);
  } catch (error) {
    console.error(error);
  }
}

getKursData();
