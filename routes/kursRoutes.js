const express = require("express");
const router = express.Router();

const {
  Indexing,
  deleteData,
  getAll,
  getBySymbol,
  createNewData,
  updateData,
  welcome,
} = require("../controllers/kursController");

router.get("/", welcome);
router.get("/api/indexing", Indexing);
router.delete("/api/kurs/:date", deleteData);
router.get("/api/kurs", getAll);
router.get("/api/kurs/:symbol", getBySymbol);
router.post("/api/kurs", createNewData);
router.put("/api/kurs", updateData);

module.exports = router;
