import express from "express";
import { sql, poolPromise } from "../db.js";

const router = express.Router();

// -----------------------------
// ADD ID Proof
// -----------------------------
router.post("/add", async (req, res) => {
  try {
    const { id_name, short_name } = req.body;
    if (!id_name || !short_name) {
      return res.status(400).json({ message: "ID Name and Short Name are required" });
    }

    const pool = await poolPromise;

    // Check if already exists (only active records)
    const exists = await pool
      .request()
      .input("id_name", sql.VarChar(100), id_name)
      .query("SELECT proof_id FROM mas_idproof WHERE id_name = @id_name AND is_active = 1");

    if (exists.recordset.length > 0) {
      return res.status(409).json({ message: "ID Proof already exists" });
    }

    // Insert new proof
    await pool
      .request()
      .input("id_name", sql.VarChar(100), id_name)
      .input("short_name", sql.VarChar(50), short_name)
      .query(`
        INSERT INTO mas_idproof (id_name, short_name, created_date, created_time, is_active)
        VALUES (@id_name, @short_name, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), 1)
      `);

    res.status(201).json({ message: "ID Proof added successfully" });
  } catch (err) {
    console.error("POST /add error in proofRoutes.js:", err);
    res.status(500).json({ message: "Insert failed", error: err.message });
  }
});

// -----------------------------
// VIEW Active ID Proofs
// -----------------------------
router.get("/view", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM mas_idproof 
      WHERE is_active = 1 
      ORDER BY proof_id DESC
    `);
    
    res.json(result.recordset); 
  } catch (err) {
    console.error("GET /view error in proofRoutes.js:", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// -----------------------------
// VIEW All ID Proofs (including inactive - for admin purposes)
// -----------------------------
router.get("/view-all", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM mas_idproof 
      ORDER BY is_active DESC, proof_id DESC
    `);
    
    res.json(result.recordset); 
  } catch (err) {
    console.error("GET /view-all error in proofRoutes.js:", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// -----------------------------
// UPDATE ID Proof
// -----------------------------
router.put("/update/:proof_id", async (req, res) => {
  try {
    const { proof_id } = req.params;
    const { id_name, short_name } = req.body;

    if (!id_name || !short_name) {
      return res.status(400).json({ message: "ID Name and Short Name are required" });
    }

    const pool = await poolPromise;

    // Check if ID name already exists (excluding current proof and only active records)
    const exists = await pool
      .request()
      .input("proof_id", sql.Int, proof_id)
      .input("id_name", sql.VarChar(100), id_name)
      .query("SELECT proof_id FROM mas_idproof WHERE id_name = @id_name AND proof_id != @proof_id AND is_active = 1");

    if (exists.recordset.length > 0) {
      return res.status(409).json({ message: "ID Proof name already exists" });
    }

    await pool
      .request()
      .input("proof_id", sql.Int, proof_id)
      .input("id_name", sql.VarChar(100), id_name)
      .input("short_name", sql.VarChar(50), short_name)
      .query(`
        UPDATE mas_idproof
        SET id_name = @id_name,
            short_name = @short_name
        WHERE proof_id = @proof_id
      `);

    res.json({ message: "ID Proof updated successfully" });
  } catch (err) {
    console.error("PUT /update error in proofRoutes.js:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// -----------------------------
// SOFT DELETE ID Proof (set inactive)
// -----------------------------
router.put("/soft-delete/:proof_id", async (req, res) => {
  try {
    const { proof_id } = req.params;
    const pool = await poolPromise;

    await pool
      .request()
      .input("proof_id", sql.Int, proof_id)
      .query("UPDATE mas_idproof SET is_active = 0 WHERE proof_id = @proof_id");

    res.json({ message: "ID Proof deactivated successfully" });
  } catch (err) {
    console.error("PUT /soft-delete error in proofRoutes.js:", err);
    res.status(500).json({ message: "Deactivation failed", error: err.message });
  }
});

// -----------------------------
// ACTIVATE ID Proof
// -----------------------------
router.put("/activate/:proof_id", async (req, res) => {
  try {
    const { proof_id } = req.params;
    const pool = await poolPromise;

    await pool
      .request()
      .input("proof_id", sql.Int, proof_id)
      .query("UPDATE mas_idproof SET is_active = 1 WHERE proof_id = @proof_id");

    res.json({ message: "ID Proof activated successfully" });
  } catch (err) {
    console.error("PUT /activate error in proofRoutes.js:", err);
    res.status(500).json({ message: "Activation failed", error: err.message });
  }
});

// Remove the hard delete endpoint completely
// router.delete("/delete/:proof_id", ...)

export default router;