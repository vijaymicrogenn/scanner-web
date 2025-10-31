import express from "express";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { sql, poolPromise } from "../db.js";

// Load environment variables
dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure QR codes directory exists
const qrCodesDir = path.join(__dirname, "../public/qr-codes");
if (!fs.existsSync(qrCodesDir)) {
  fs.mkdirSync(qrCodesDir, { recursive: true });
  console.log("✅ Created QR codes directory:", qrCodesDir);
}

// ✅ Database helper functions using your existing db.js
const initializeDatabase = async () => {
  try {
    const pool = await poolPromise;
    
    // Create hotels table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hotels' AND xtype='U')
      CREATE TABLE hotels (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) UNIQUE NOT NULL,
        name NVARCHAR(255) NOT NULL,
        qr_generated BIT DEFAULT 0,
        last_qr_generated DATETIME2 NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Insert default hotels if table is empty
    const result = await pool.request().query('SELECT COUNT(*) as count FROM hotels');
    if (result.recordset[0].count === 0) {
       

      for (const hotel of defaultHotels) {
        await pool.request()
          .input('code', sql.NVarChar, hotel.code)
          .input('name', sql.NVarChar, hotel.name)
          .query('INSERT INTO hotels (code, name) VALUES (@code, @name)');
      }
      console.log('✅ Default hotels inserted');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Initialize database on startup
initializeDatabase();

// ✅ Get predefined hotels from database
const getPredefinedHotels = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT code, name, qr_generated, last_qr_generated FROM hotels WHERE is_active = 1 ORDER BY name');
    return result.recordset;
  } catch (error) {
    console.error('Error reading hotels from database:', error);
    return [];
  }
};

// ✅ Check if a hotel code is valid (exists in database)
const isValidHotelCode = async (hotelCode) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('code', sql.NVarChar, hotelCode)
      .query('SELECT COUNT(*) as count FROM hotels WHERE code = @code AND is_active = 1');
    return result.recordset[0].count > 0;
  } catch (error) {
    console.error('Error checking hotel code:', error);
    return false;
  }
};

// ✅ Check if a hotel code has QR generated
const isCodeGenerated = async (hotelCode) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('code', sql.NVarChar, hotelCode)
      .query('SELECT qr_generated FROM hotels WHERE code = @code AND is_active = 1');
    return result.recordset[0]?.qr_generated || false;
  } catch (error) {
    console.error('Error checking QR generation status:', error);
    return false;
  }
};

// ✅ Get hotel name by code
const getHotelName = async (hotelCode) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('code', sql.NVarChar, hotelCode)
      .query('SELECT name FROM hotels WHERE code = @code AND is_active = 1');
    return result.recordset[0]?.name || hotelCode;
  } catch (error) {
    console.error('Error getting hotel name:', error);
    return hotelCode;
  }
};

// ✅ Update QR generation status in database
const updateQRGenerationStatus = async (hotelCode, generated = true) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('code', sql.NVarChar, hotelCode)
      .input('qr_generated', sql.Bit, generated)
      .input('last_qr_generated', sql.DateTime2, generated ? new Date() : null)
      .query(`
        UPDATE hotels 
        SET qr_generated = @qr_generated, 
            last_qr_generated = @last_qr_generated,
            updated_at = GETDATE()
        WHERE code = @code
      `);
    return true;
  } catch (error) {
    console.error('Error updating QR generation status:', error);
    return false;
  }
};

// ✅ Fixed Base URL Resolver
const getBaseUrl = (req) => {
  let frontendUrl = process.env.FRONTEND_URL;

  if (frontendUrl && frontendUrl.trim() !== "") {
    if (frontendUrl.endsWith("/")) frontendUrl = frontendUrl.slice(0, -1);
    return frontendUrl;
  }

  const protocol = req.protocol;
  const host = req.get("host");
  const baseUrl = `${protocol}://${host}`;
  return baseUrl;
};

// ✅ Generate QR codes for all predefined hotels
router.get("/generate-all", async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const predefinedHotels = await getPredefinedHotels();
    const generatedQRCodes = [];

    for (const hotel of predefinedHotels) {
      const qrData = `${baseUrl}/userform?hotelCode=${hotel.code}`;
      const fileName = `hotel_${hotel.code}_${Date.now()}.png`;
      const filePath = path.join(qrCodesDir, fileName);

      await QRCode.toFile(filePath, qrData, {
        color: { dark: "#000000", light: "#FFFFFF" },
        width: 400,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      // Update QR generation status in database
      await updateQRGenerationStatus(hotel.code, true);

      generatedQRCodes.push({
        hotelCode: hotel.code,
        hotelName: hotel.name,
        fileName,
        qrImageUrl: `/api/qr-codes/preview/${fileName}`,
        downloadUrl: `/api/qr-codes/download/${fileName}`,
        scanUrl: qrData,
        generatedTime: Date.now(),
      });

      console.log(`✅ Generated QR for ${hotel.name}: ${qrData}`);
    }

    res.json({
      success: true,
      message: `Generated ${generatedQRCodes.length} QR codes successfully`,
      qrCodes: generatedQRCodes,
    });
  } catch (error) {
    console.error("❌ QR generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Generate QR code for a single hotel - ONLY VALID CODES
router.post("/generate", async (req, res) => {
  try {
    const { hotelCode, hotelName } = req.body;
    
    if (!hotelCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Hotel code is required" 
      });
    }

    // Validate hotel code format
    // if (!/^[a-z0-9-]+$/.test(hotelCode.trim())) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: "Hotel code can only contain lowercase letters, numbers, and hyphens" 
    //   });
    // }

    // Validate hotel code exists in database
    const isValid = await isValidHotelCode(hotelCode);
    if (!isValid) {
      const predefinedHotels = await getPredefinedHotels();
      return res.status(400).json({ 
        success: false, 
        message: "Invalid hotel code. Only predefined hotel codes are allowed.",
        validCodes: predefinedHotels.map(h => h.code)
      });
    }

    const baseUrl = getBaseUrl(req);
    const qrData = `${baseUrl}/userform?hotelCode=${hotelCode}`;
    const fileName = `hotel_${hotelCode}_${Date.now()}.png`;
    const filePath = path.join(qrCodesDir, fileName);

    await QRCode.toFile(filePath, qrData, {
      color: { dark: "#000000", light: "#FFFFFF" },
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    // Update QR generation status in database
    await updateQRGenerationStatus(hotelCode, true);

    const actualHotelName = await getHotelName(hotelCode);

    res.json({
      success: true,
      message: "QR code generated successfully",
      qrCode: {
        hotelCode,
        hotelName: hotelName || actualHotelName,
        fileName,
        qrImageUrl: `/api/qr-codes/preview/${fileName}`,
        downloadUrl: `/api/qr-codes/download/${fileName}`,
        scanUrl: qrData,
      },
    });
  } catch (error) {
    console.error("❌ QR generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ List all generated QR codes
router.get("/list", async (req, res) => {
  try {
    // Check if directory exists
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir, { recursive: true });
      return res.json({ 
        success: true, 
        qrCodes: [],
        predefinedHotels: await getPredefinedHotels(),
        generatedCodes: []
      });
    }

    const files = fs.readdirSync(qrCodesDir);
    const baseUrl = getBaseUrl(req);

    const qrCodes = [];
    for (const file of files) {
      if (file.endsWith(".png")) {
        const hotelCodeMatch = file.match(/^hotel_([^_]+)_/);
        const hotelCode = hotelCodeMatch ? hotelCodeMatch[1] : "unknown";
        const timestampMatch = file.match(/_(\d+)\.png$/);
        const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

        try {
          const isValid = await isValidHotelCode(hotelCode);
          const isGenerated = await isCodeGenerated(hotelCode);

          if (isValid && isGenerated) {
            const hotelName = await getHotelName(hotelCode);
            qrCodes.push({
              fileName: file,
              hotelCode,
              hotelName,
              generatedTime: timestamp,
              qrImageUrl: `/api/qr-codes/preview/${file}`,
              downloadUrl: `/api/qr-codes/download/${file}`,
              scanUrl: `${baseUrl}/userform?hotelCode=${hotelCode}`,
              isValid,
              isGenerated
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }
    }

    // Sort by generation time (newest first)
    qrCodes.sort((a, b) => b.generatedTime - a.generatedTime);

    const predefinedHotels = await getPredefinedHotels();

    res.json({ 
      success: true, 
      qrCodes,
      predefinedHotels,
      generatedCodes: predefinedHotels.filter(h => h.qr_generated).map(h => h.code)
    });
  } catch (error) {
    console.error("❌ List QR codes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete QR code - ONLY IF VALID AND GENERATED
router.delete("/delete/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(qrCodesDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code file not found" 
      });
    }

    // Extract hotel code from filename and validate
    const hotelCodeMatch = filename.match(/^hotel_([^_]+)_/);
    const hotelCode = hotelCodeMatch ? hotelCodeMatch[1] : null;
    
    if (!hotelCode || !(await isValidHotelCode(hotelCode))) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete QR code for invalid hotel code" 
      });
    }

    // Update QR generation status in database
    await updateQRGenerationStatus(hotelCode, false);

    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted valid QR code: ${filename}`);

    res.json({ 
      success: true, 
      message: "QR code deleted successfully" 
    });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Download QR code - ONLY IF VALID AND GENERATED
router.get("/download/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(qrCodesDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code file not found" 
      });
    }

    // Extract hotel code from filename and validate
    const hotelCodeMatch = filename.match(/^hotel_([^_]+)_/);
    const hotelCode = hotelCodeMatch ? hotelCodeMatch[1] : null;
    
    if (!hotelCode || !(await isValidHotelCode(hotelCode)) || !(await isCodeGenerated(hotelCode))) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot download QR code for invalid or non-generated hotel code" 
      });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Download error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Preview QR code - ONLY IF VALID AND GENERATED
router.get("/preview/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(qrCodesDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code file not found" 
      });
    }

    // Extract hotel code from filename and validate
    const hotelCodeMatch = filename.match(/^hotel_([^_]+)_/);
    const hotelCode = hotelCodeMatch ? hotelCodeMatch[1] : null;
    
    if (!hotelCode || !(await isValidHotelCode(hotelCode)) || !(await isCodeGenerated(hotelCode))) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot preview QR code for invalid or non-generated hotel code" 
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Preview error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get predefined hotels from database
router.get("/predefined-hotels", async (req, res) => {
  try {
    const predefinedHotels = await getPredefinedHotels();
    res.json({
      success: true,
      predefinedHotels,
      count: predefinedHotels.length
    });
  } catch (error) {
    console.error("❌ Get predefined hotels error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Add new hotel to database
router.post("/hotels", async (req, res) => {
  try {
    const { code, name } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "Hotel code and name are required"
      });
    }

    // Validate hotel code format
    if (!/^[a-z0-9-]+$/.test(code.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Hotel code can only contain lowercase letters, numbers, and hyphens" 
      });
    }

    const pool = await poolPromise;
    
    // Check if hotel code already exists
    const existing = await pool.request()
      .input('code', sql.NVarChar, code)
      .query('SELECT COUNT(*) as count FROM hotels WHERE code = @code');
    
    if (existing.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Hotel code already exists"
      });
    }

    // Insert new hotel
    await pool.request()
      .input('code', sql.NVarChar, code)
      .input('name', sql.NVarChar, name)
      .query('INSERT INTO hotels (code, name) VALUES (@code, @name)');

    res.json({
      success: true,
      message: "Hotel added successfully"
    });
  } catch (error) {
    console.error("❌ Add hotel error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update hotel in database
router.put("/hotels/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Hotel name is required"
      });
    }

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .input('name', sql.NVarChar, name)
      .query('UPDATE hotels SET name = @name, updated_at = GETDATE() WHERE code = @code');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found"
      });
    }

    res.json({
      success: true,
      message: "Hotel updated successfully"
    });
  } catch (error) {
    console.error("❌ Update hotel error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete hotel from database (soft delete)
router.delete("/hotels/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .query('UPDATE hotels SET is_active = 0, updated_at = GETDATE() WHERE code = @code');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found"
      });
    }

    res.json({
      success: true,
      message: "Hotel deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete hotel error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get generated codes list
router.get("/generated-codes", async (req, res) => {
  try {
    const predefinedHotels = await getPredefinedHotels();
    const generatedCodes = predefinedHotels
      .filter(hotel => hotel.qr_generated)
      .map(hotel => hotel.code);
    
    res.json({
      success: true,
      generatedCodes
    });
  } catch (error) {
    console.error("❌ Get generated codes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Check if a code is generated
router.get("/check-code/:hotelCode", async (req, res) => {
  try {
    const { hotelCode } = req.params;
    const isGenerated = await isCodeGenerated(hotelCode);
    const isValid = await isValidHotelCode(hotelCode);
    
    res.json({
      success: true,
      hotelCode,
      isValid,
      isGenerated,
      message: isValid ? 
        (isGenerated ? "Code is valid and generated" : "Code is valid but not generated") :
        "Code is not valid"
    });
  } catch (error) {
    console.error("❌ Check code error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;