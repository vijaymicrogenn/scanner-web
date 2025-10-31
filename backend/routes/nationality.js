import express from "express";
import { sql, poolPromise } from "../db.js";

const router = express.Router();

// Add Nationality
router.post("/add", async (req, res) => {
  try {
    const { nationality_name } = req.body;
    if (!nationality_name) return res.status(400).json({ message: "Nationality name required" });

    const pool = await poolPromise;
    const exists = await pool.request()
      .input("nationality_name", sql.VarChar(100), nationality_name)
      .query("SELECT nationality_id FROM mas_nationality WHERE nationality_name = @nationality_name AND is_active = 1");

    if (exists.recordset.length > 0) return res.status(409).json({ message: "Nationality already exists" });

    await pool.request()
      .input("nationality_name", sql.VarChar(100), nationality_name)
      .query(`
        INSERT INTO mas_nationality (nationality_name, created_date, created_time, is_active)
        VALUES (@nationality_name, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), 1)
      `);

    res.status(201).json({ message: "Nationality added successfully" });
  } catch (err) {
    console.error("POST /add error in nationality.js:", err);
    res.status(500).json({ message: "Insert failed", error: err.message });
  }
});

// VIEW Active Nationalities
router.get("/view", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM mas_nationality 
      WHERE is_active = 1 
      ORDER BY nationality_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET /view error in nationality.js:", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// VIEW All Nationalities (including inactive - for admin purposes)
router.get("/view-all", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM mas_nationality 
      ORDER BY is_active DESC, nationality_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET /view-all error in nationality.js:", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// UPDATE Nationality
router.put("/update/:id", async (req, res) => {
  try {
    const { nationality_name } = req.body;
    const pool = await poolPromise;
    
    // Check if nationality name already exists (excluding current nationality)
    const exists = await pool.request()
      .input("nationality_id", sql.Int, req.params.id)
      .input("nationality_name", sql.VarChar(100), nationality_name)
      .query("SELECT nationality_id FROM mas_nationality WHERE nationality_name = @nationality_name AND nationality_id != @nationality_id AND is_active = 1");

    if (exists.recordset.length > 0) return res.status(409).json({ message: "Nationality name already exists" });

    await pool.request()
      .input("nationality_id", sql.Int, req.params.id)
      .input("nationality_name", sql.VarChar(100), nationality_name)
      .query(`
        UPDATE mas_nationality
        SET nationality_name = @nationality_name
        WHERE nationality_id = @nationality_id
      `);
    res.json({ message: "Nationality updated successfully" });
  } catch (err) {
    console.error("PUT /update error in nationality.js:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// SOFT DELETE Nationality (set inactive)
router.put("/soft-delete/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("nationality_id", sql.Int, req.params.id)
      .query("UPDATE mas_nationality SET is_active = 0 WHERE nationality_id = @nationality_id");
    
    res.json({ message: "Nationality deactivated successfully" });
  } catch (err) {
    console.error("PUT /soft-delete error in nationality.js:", err);
    res.status(500).json({ message: "Deactivation failed", error: err.message });
  }
});

// ACTIVATE Nationality
router.put("/activate/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("nationality_id", sql.Int, req.params.id)
      .query("UPDATE mas_nationality SET is_active = 1 WHERE nationality_id = @nationality_id");
    
    res.json({ message: "Nationality activated successfully" });
  } catch (err) {
    console.error("PUT /activate error in nationality.js:", err);
    res.status(500).json({ message: "Activation failed", error: err.message });
  }
});

// Remove the hard delete endpoint completely
// router.delete("/delete/:id", ...)

export default router;