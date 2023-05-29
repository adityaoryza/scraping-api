# Currency Exchange Rate API Documentation

The Currency Exchange Rate API provides endpoints to fetch, store, update, and delete currency exchange rate data. The data is collected from https://www.bca.co.id/id/informasi/kurs, the official website of Bank Central Asia (BCA) in Indonesia.

## API Base URL

    http://localhost:7000

## Endpoints

## Indexing and Scraping Currency Exchange Rate Data

This route performs scraping on https://www.bca.co.id/id/informasi/kurs to collect and store the latest currency exchange rate data in the database.

URL: /api/indexing

Method: GET

Response:

-200 OK: Scraping and indexing completed.
-500 Internal Server Error: Scraping and indexing failed.

## Delete Currency Exchange Rate Data by Date

This route deletes currency exchange rate data from the database based on the specified date.

URL: /api/kurs/:date

Method: DELETE

Parameters:

date (required): The date in "YYYY-mm-dd" format.

Response:

-200 OK: Deleted records for the specified date.
-500 Internal Server Error: Failed to delete records.

## Get Currency Exchange Rate Data within a Date Range

This route retrieves currency exchange rate data from the database within the specified date range.

URL: /api/kurs?startdate=:startdate&enddate=:enddate

Method: GET

Query Parameters:

startdate (required): The start date in "YYYY-mm-dd" format.

enddate (required): The end date in "YYYY-mm-dd" format.

Response:

-200 OK: Array of currency exchange rate records within the specified date range.
-500 Internal Server Error: Failed to fetch the records.

## Get Currency Exchange Rate Data by Symbol and Date Range

This route retrieves currency exchange rate data from the database for a specific symbol within the specified date range.

URL: /api/kurs/:symbol?startdate=:startdate&enddate=:enddate

Method: GET

Parameters:

symbol (required): The currency symbol (e.g., USD).

Query Parameters:

startdate (required): The start date in "YYYY-mm-dd" format.

enddate (required): The end date in "YYYY-mm-dd" format.

Response:

-200 OK: Array of currency exchange rate records for the specified symbol within the specified date range.
-500 Internal Server Error: Failed to fetch the records.

## Add Currency Exchange Rate Data

This route adds new currency exchange rate data to the database. If the data already exists, it will be skipped.

URL: /api/kurs

Method: POST

Request Body:

Response:

-200 OK: Data successfully inserted.
-409 Conflict: Data already exists.
-500 Internal Server Error: Failed to insert data.

## Update Currency Exchange Rate Data

This route updates existing currency exchange rate data in the database. If the data does not exist, a 404 error is returned.

URL: /api/kurs

Method: PUT

Request Body:

Response:

-200 OK: Data successfully updated.
-404 Not Found: Data not found.
-500 Internal Server Error: Failed to update data.

Please note that the API is running on http://localhost:7000. Make sure to replace it with the appropriate base URL when making requests.
