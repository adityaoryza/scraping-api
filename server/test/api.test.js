const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('..');
const Data = require('../models/data.js');

const { expect } = chai;

chai.use(chaiHttp);

describe('API Endpoint Tests', () => {
  //note  Unit test for => GET /api/indexing
  describe('GET /api/indexing', () => {
    it('should scrape and index data for the current date', function (done) {
      this.timeout(10000);

      chai
        .request(app)
        .get('/api/indexing')
        .end(async (err, res) => {
          expect(res).to.have.status(200);
          expect(res.body)
            .to.have.property('message')
            .satisfy((message) => {
              return (
                message === 'Scraping and indexing completed' ||
                message === 'Data for the current date already exists'
              );
            });

          if (res.body.message === 'Scraping and indexing completed') {
            // Check if the data is pushed to the database
            const currentDate = new Date().toISOString().split('T')[0];
            const data = await Data.findOne({ date: currentDate });
            expect(data).to.not.be.null;
          }

          done();
        });
    });
  });

  //note  Unit test for => GET /api/kurs
  describe('GET /api/kurs', () => {
    it('should return records for the specified date range', (done) => {
      const startdate = new Date().toISOString().split('T')[0]; //note Must be Replace with a valid date in database
      const enddate = new Date().toISOString().split('T')[0]; //note Must be Replace with a valid date in database

      chai
        .request(app)
        .get('/api/kurs')
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('should return 404 if no records found for the specified date range', (done) => {
      const startdate = '2002-06-01'; //note Must be Replace with a valid date in database
      const enddate = '2002-06-30'; //note Must be Replace with a valid date in database

      chai
        .request(app)
        .get('/api/kurs')
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body)
            .to.have.property('error')
            .that.includes('No records found');
          done();
        });
    });

    it('should return 500 if an error occurs during invalid-date format', (done) => {
      // Simulating an error by passing an invalid date range
      const startdate = 'invalid-date';
      const enddate = new Date().toISOString().split('T')[0];

      chai
        .request(app)
        .get('/api/kurs')
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body)
            .to.have.property('error')
            .that.equals('Invalid date format');
          done();
        });
    });
  });

  //note  Unit test for => GET /api/kurs/:symbol
  describe('GET /api/kurs/:symbol', () => {
    it('should return records for the specified symbol and date range', (done) => {
      const symbol = 'USD'; //note Must be replace with a valid symbol in dataset
      const startdate = new Date().toISOString().split('T')[0]; //note Must be Replace with a valid date in database
      const enddate = new Date().toISOString().split('T')[0]; //note Must be Replace with a valid date in database

      chai
        .request(app)
        .get(`/api/kurs/${symbol}`)
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('should return 404 if no records found for the specified symbol and date range', (done) => {
      const symbol = 'KKK'; //note Must be replace with in-valid symbol in dataset
      const startdate = '2003-05-29'; //note Must be Replace with a valid date in database
      const enddate = '2003-05-31'; //note Must be Replace with a valid date in database

      chai
        .request(app)
        .get(`/api/kurs/${symbol}`)
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body)
            .to.have.property('error')
            .that.equals(
              'No records found for the specified symbol and date range'
            );
          done();
        });
    });

    it('should return a CastError if an invalid date format is provided', (done) => {
      const symbol = 'USD';
      const startdate = 'invalid-date';
      const enddate = '2023-05-31';

      chai
        .request(app)
        .get(`/api/kurs/${symbol}`)
        .query({ startdate, enddate })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body)
            .to.have.property('error')
            .that.equals('Invalid startdate or enddate');
          done();
        });
    });
  });

  //note  Unit test for => POST /api/kurs
  describe('POST /api/kurs', () => {
    it('should insert kurs data and return success message', (done) => {
      const kursData = {
        symbol: 'USD',
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
        date: '2017-05-16',
      };

      chai
        .request(app)
        .post('/api/kurs')
        .send(kursData)
        .end((err, res) => {
          if (err) {
            console.error('Error inserting data:', err);
            done(err);
          } else {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property(
              'message',
              'Data successfully inserted'
            );
            expect(res.body.data).to.deep.equal(kursData);

            // Delete the inserted kurs data so it doesn't interfere with other tests
            Data.deleteOne(kursData)
              .then(() => {
                done();
              })
              .catch((error) => {
                console.error('Error deleting data:', error);
                done(error);
              });
          }
        });
    });

    it('should return an error for incomplete data', (done) => {
      const kursData = {
        symbol: 'USD',
        date: '2023-05-30',
        e_rate: 14100,
        // Missing tt_counter and bank_notes fields
      };

      chai
        .request(app)
        .post('/api/kurs')
        .send(kursData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property(
            'error',
            'Incomplete data. Please provide symbol, date, value, e_rate, tt_counter, and bank_notes fields'
          );
          done();
        });
    });

    it('should return an error if data already exists', (done) => {
      const kursData = {
        symbol: 'USD',
        date: new Date().toISOString().split('T')[0], //note Must be Replace with a valid date in database that exists
        e_rate: 14100,
        tt_counter: 14050,
        bank_notes: 13950,
      };

      chai
        .request(app)
        .post('/api/kurs')
        .send(kursData)
        .end((err, res) => {
          expect(res).to.have.status(409);
          expect(res.body).to.have.property('error', 'Data already exists');
          done();
        });
    });
  });

  //note  Unit test for => PUT /api/kurs
  describe('PUT /api/kurs', () => {
    it('should update an existing data record', (done) => {
      const kursData = {
        symbol: 'USD',
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
        date: new Date().toISOString().split('T')[0], //note should be date that exist in the database
      };

      chai
        .request(app)
        .put('/api/kurs')
        .send(kursData)
        .end((err, res) => {
          if (err) {
            console.error('Error updating data:', err);
            done(err);
          } else {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property(
              'message',
              'Data successfully updated'
            );
            expect(res.body.data).to.include.all.keys('__v', '_id');
            expect(res.body.data).to.deep.include({
              symbol: kursData.symbol,
              e_rate: kursData.e_rate,
              tt_counter: kursData.tt_counter,
              bank_notes: kursData.bank_notes,
              date:
                new Date(kursData.date).toISOString().split('T')[0] +
                'T00:00:00.000Z',
            });

            done();
          }
        });
    });

    it('should return an error if data record not found', async () => {
      const currentDate = new Date();
      const randomOffset = Math.floor(Math.random() * (365 * 10)); // Generate a random number between 0 and 3650 (10 years)
      const pastDate = new Date(
        currentDate.getTime() - randomOffset * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];
      let existingRecord = await Data.findOne({ date: pastDate });

      while (existingRecord) {
        const randomOffset = Math.floor(Math.random() * (365 * 10));
        const pastDate = new Date(
          currentDate.getTime() - randomOffset * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split('T')[0];
        existingRecord = await Data.findOne({ date: pastDate });
      }

      const kursData = {
        symbol: 'BBB',
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
        date: pastDate,
      };

      const res = await chai.request(app).put('/api/kurs').send(kursData);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('error', 'Data not found');
    });
  });

  //note  Unit test for => DELETE /api/kurs/:date
  describe('DELETE /api/kurs/:date', () => {
    it('should delete records for the specified date', (done) => {
      const date = new Date().toISOString().split('T')[0]; // Replace with a valid date in the database

      chai
        .request(app)
        .delete(`/api/kurs/${date}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message').that.includes(date);
          done(); // Call done() to indicate the completion of the test
        });
    });

    it('should return 404 if no records found for the specified date', (done) => {
      const date = '2003-05-30'; //note Must be Replace with a valid date in database

      chai
        .request(app)
        .delete(`/api/kurs/${date}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('error').that.includes(date);
          done();
        });
    });

    it('should return 500 if an error occurs during deletion and invalid-date', (done) => {
      // Simulating an error by passing an invalid date format
      const date = 'invalid-date';

      chai
        .request(app)
        .delete(`/api/kurs/${date}`)
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body)
            .to.have.property('error')
            .that.equals('Invalid date format');
          done();
        });
    });
  });
});
