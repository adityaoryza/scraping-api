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
      this.timeout(5000);

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
});
