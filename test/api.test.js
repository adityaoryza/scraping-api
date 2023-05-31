const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon"); // Import sinon library
const app = require("../server/app");
const Data = require("../database/data.js");

const { expect } = chai;

chai.use(chaiHttp);

describe("API Endpoint Tests", () => {
  //note  Test /api/indexing
  describe("GET /api/indexing", () => {
    it("should scrape and index data for the current date", function (done) {
      this.timeout(10000);

      chai
        .request(app)
        .get("/api/indexing")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body)
            .to.have.property("message")
            .satisfy((message) => {
              return (
                message === "Scraping and indexing completed" ||
                message === "Data for the current date already exists"
              );
            });
          done();
        });
    });
  });
  //   note delete
  describe("DELETE /api/kurs/:date", () => {
    it("should delete records for the specified date", (done) => {
      const date = "2023-05-31"; // Replace with a valid date from your dataset

      chai
        .request(app)
        .delete(`/api/kurs/${date}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message").that.includes(date);
          done();
        });
    });

    it("should return 404 if no records found for the specified date", (done) => {
      const date = "2003-05-30"; // Replace with a date that has no records in your dataset

      chai
        .request(app)
        .delete(`/api/kurs/${date}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("error").that.includes(date);
          done();
        });
    });

    it("should return 500 if an error occurs during deletion and invalid-date", (done) => {
      // Simulating an error by passing an invalid date format
      const date = "invalid-date";

      chai
        .request(app)
        .delete(`/api/kurs/${date}`)
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body)
            .to.have.property("error")
            .that.equals("Invalid date format");
          done();
        });
    });
  });
  // note 3
  describe("GET /api/kurs", () => {
    it("should return records for the specified date range", (done) => {
      const startdate = "2023-05-29"; // Replace with a valid start date from your dataset
      const enddate = "2023-05-31"; // Replace with a valid end date from your dataset

      chai
        .request(app)
        .get("/api/kurs")
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          // Add more specific assertions based on the response structure or data
          done();
        });
    });

    it("should return 404 if no records found for the specified date range", (done) => {
      const startdate = "2023-06-01"; // Replace with a date range that has no records in your dataset
      const enddate = "2023-06-30";

      chai
        .request(app)
        .get("/api/kurs")
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body)
            .to.have.property("error")
            .that.includes("No records found");
          done();
        });
    });

    it("should return 500 if an error occurs during invalid-date format", (done) => {
      // Simulating an error by passing an invalid date range
      const startdate = "invalid-date";
      const enddate = "2023-05-31";

      chai
        .request(app)
        .get("/api/kurs")
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body)
            .to.have.property("error")
            .that.equals("Invalid date format");
          done();
        });
    });
  });
  // note 4
  describe("GET /api/kurs/:symbol", () => {
    it("should return records for the specified symbol and date range", (done) => {
      const symbol = "USD"; // Replace with a valid symbol from your dataset
      const startdate = "2023-05-29"; // Replace with a valid start date from your dataset
      const enddate = "2023-05-31"; // Replace with a valid end date from your dataset

      chai
        .request(app)
        .get(`/api/kurs/${symbol}`)
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          done();
        });
    });

    it("should return 404 if no records found for the specified symbol and date range", (done) => {
      const symbol = "KKK";
      const startdate = "2023-05-29";
      const enddate = "2023-05-31";

      chai
        .request(app)
        .get(`/api/kurs/${symbol}`)
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body)
            .to.have.property("error")
            .that.equals(
              "No records found for the specified symbol and date range"
            );
          done();
        });
    });

    it("should return a CastError if an invalid date format is provided", (done) => {
      const symbol = "USD";
      const startdate = "invalid-date";
      const enddate = "2023-05-31";

      chai
        .request(app)
        .get(`/api/kurs/${symbol}`)
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body)
            .to.have.property("error")
            .that.equals("Invalid startdate or enddate");
          done();
        });
    });
  });
  // note 4
  describe("POST /api/kurs", () => {
    it("should insert kurs data and return success message", (done) => {
      const kursData = {
        symbol: "USD",
        e_rate: {
          jual: 1803.55,
          beli: 177355,
        },
        tt_counter: {
          jual: 1803.55,
          beli: 177355,
        },
        bank_notes: {
          jual: 1803.55,
          beli: 177355,
        },
        date: "2017-05-16",
      };

      chai
        .request(app)
        .post("/api/kurs")
        .send(kursData)
        .end((err, res) => {
          if (err) {
            console.error("Error inserting data:", err);
            done(err);
          } else {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property(
              "message",
              "Data successfully inserted"
            );
            expect(res.body.data).to.deep.equal(kursData);

            // Delete the inserted kurs data so it doesn't interfere with other tests
            Data.deleteOne(kursData)
              .then(() => {
                done();
              })
              .catch((error) => {
                console.error("Error deleting data:", error);
                done(error);
              });
          }
        });
    });

    it("should return an error for incomplete data", (done) => {
      const kursData = {
        symbol: "USD",
        date: "2023-05-30",
        e_rate: 14100,
        // Missing tt_counter and bank_notes fields
      };

      chai
        .request(app)
        .post("/api/kurs")
        .send(kursData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property(
            "error",
            "Incomplete data. Please provide symbol, date, value, e_rate, tt_counter, and bank_notes fields"
          );
          done();
        });
    });

    it("should return an error if data already exists", (done) => {
      const kursData = {
        symbol: "USD",
        date: "2023-05-30",
        e_rate: 14100,
        tt_counter: 14050,
        bank_notes: 13950,
      };

      chai
        .request(app)
        .post("/api/kurs")
        .send(kursData)
        .end((err, res) => {
          expect(res).to.have.status(409);
          expect(res.body).to.have.property("error", "Data already exists");
          done();
        });
    });
  });
  // note endpoint 6 unit test
});
