import express from "express";
import bcrypt from "bcrypt";
import { poolPromise, sql } from "../db.js";

const router = express.Router();

// POST /api/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await poolPromise;

    // Get user by username
    const result = await pool
      .request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM admin_users WHERE username = @username");

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username" });
    }

    const user = result.recordset[0];

    // Compare password with hash
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    res.json({ success: true, message: "✅ Login successful!" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
