import express from "express";
import { sql, poolPromise } from "../db.js";

const router = express.Router();

// Add City
router.post("/add", async (req, res) => {
  try {
    const { city_name } = req.body;
    if (!city_name) return res.status(400).json({ message: "City name required" });

    const pool = await poolPromise;
    const exists = await pool.request()
      .input("city_name", sql.VarChar(100), city_name)
      .query("SELECT city_id FROM mas_city WHERE city_name = @city_name AND is_active = 1");

    if (exists.recordset.length > 0) return res.status(409).json({ message: "City already exists" });

    await pool.request()
      .input("city_name", sql.VarChar(100), city_name)
      .query(`
        INSERT INTO mas_city (city_name, created_date, created_time, is_active)
        VALUES (@city_name, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), 1)
      `);

    res.status(201).json({ message: "City added successfully" });
  } catch (err) {
    console.error("POST /add error in City.js:", err);
    res.status(500).json({ message: "Insert failed", error: err.message });
  }
});

// VIEW Active Cities
router.get("/view", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM mas_city 
      WHERE is_active = 1 
      ORDER BY city_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET /view error in City.js:", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// VIEW All Cities (including inactive - for admin purposes)
router.get("/view-all", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM mas_city 
      ORDER BY is_active DESC, city_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET /view-all error in City.js:", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// UPDATE City
router.put("/update/:id", async (req, res) => {
  try {
    const { city_name } = req.body;
    const pool = await poolPromise;
    
    // Check if city name already exists (excluding current city)
    const exists = await pool.request()
      .input("city_id", sql.Int, req.params.id)
      .input("city_name", sql.VarChar(100), city_name)
      .query("SELECT city_id FROM mas_city WHERE city_name = @city_name AND city_id != @city_id AND is_active = 1");

    if (exists.recordset.length > 0) return res.status(409).json({ message: "City name already exists" });

    await pool.request()
      .input("city_id", sql.Int, req.params.id)
      .input("city_name", sql.VarChar(100), city_name)
      .query(`
        UPDATE mas_city
        SET city_name = @city_name
        WHERE city_id = @city_id
      `);
    res.json({ message: "City updated successfully" });
  } catch (err) {
    console.error("PUT /update error in City.js:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// SOFT DELETE City (set inactive)
router.put("/soft-delete/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("city_id", sql.Int, req.params.id)
      .query("UPDATE mas_city SET is_active = 0 WHERE city_id = @city_id");
    
    res.json({ message: "City deactivated successfully" });
  } catch (err) {
    console.error("PUT /soft-delete error in City.js:", err);
    res.status(500).json({ message: "Deactivation failed", error: err.message });
  }
});

// ACTIVATE City
router.put("/activate/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("city_id", sql.Int, req.params.id)
      .query("UPDATE mas_city SET is_active = 1 WHERE city_id = @city_id");
    
    res.json({ message: "City activated successfully" });
  } catch (err) {
    console.error("PUT /activate error in City.js:", err);
    res.status(500).json({ message: "Activation failed", error: err.message });
  }
});

// Remove the hard delete endpoint completely
// router.delete("/delete/:id", ...)

export default router;