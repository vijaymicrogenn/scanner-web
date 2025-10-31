import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { poolPromise, sql } from "../db.js";
import QRCode from "qrcode";
import cron from "node-cron";

const router = express.Router();

// ---------------- File Cleanup Scheduler ----------------
// Runs daily at 2 AM to delete files older than 7 days
cron.schedule('0 2 * * *', () => {
  console.log('🔄 Running scheduled file cleanup...');
  cleanupOldFiles();
});

async function cleanupOldFiles() {
  try {
    const imagesBasePath = path.join(process.cwd(), 'images');
    if (!fs.existsSync(imagesBasePath)) {
      console.log('📁 No images directory found, skipping cleanup');
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago
    console.log(`🗑️ Cleaning up files older than: ${cutoffDate.toISOString()}`);

    let deletedCount = 0;
    let errorCount = 0;

    // Recursively traverse and delete old files
    function traverseAndClean(dirPath) {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        
        try {
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory()) {
            traverseAndClean(itemPath);
            
            // Remove empty directories after processing
            try {
              const remainingItems = fs.readdirSync(itemPath);
              if (remainingItems.length === 0) {
                fs.rmdirSync(itemPath);
                console.log(`📁 Removed empty directory: ${itemPath}`);
              }
            } catch (dirErr) {
              console.error(`❌ Error checking directory: ${itemPath}`, dirErr.message);
            }
          } else if (stat.isFile()) {
            const fileDate = new Date(stat.mtime);
            if (fileDate < cutoffDate) {
              try {
                fs.unlinkSync(itemPath);
                deletedCount++;
                console.log(`✅ Deleted old file: ${itemPath}`);
              } catch (unlinkErr) {
                errorCount++;
                console.error(`❌ Error deleting file: ${itemPath}`, unlinkErr.message);
              }
            }
          }
        } catch (statErr) {
          console.error(`❌ Error accessing path: ${itemPath}`, statErr.message);
          errorCount++;
        }
      }
    }

    traverseAndClean(imagesBasePath);
    console.log(`🗑️ Cleanup completed: ${deletedCount} files deleted, ${errorCount} errors`);
    
  } catch (err) {
    console.error('❌ File cleanup error:', err);
  }
}

// ---------------- Direct File Storage (No Temporary Uploads) ----------------
const storage = multer.memoryStorage(); // Store files in memory instead of disk

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/"))
    return cb(new Error("Only images are allowed"), false);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ---------------- MIME Type to Extension Mapping ----------------
const mimeToExtension = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp'
};

// ---------------- Direct File Save Helper ----------------
async function saveFileDirectly(fileBuffer, originalName, fileType, userName = null, hotelCode = null, mimeType = null) {
  try {
    const effectiveHotelCode = hotelCode || "grandhotel";
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const dateFolder = `${day}.${month}.${year}`;
    const userFolder = userName
      ? `${userName.replace(/\s+/g, "_")}`
      : "temp_user";

    let uploadFolder;
    if (fileType.includes("profile") || fileType === "profile") {
      uploadFolder = `images/${effectiveHotelCode}/${dateFolder}/${userFolder}/profile_image`;
    } else if (fileType.includes("id") || fileType === "id") {
      uploadFolder = `images/${effectiveHotelCode}/${dateFolder}/${userFolder}/id_image`;
    } else {
      uploadFolder = `images/${effectiveHotelCode}/${dateFolder}/${userFolder}/misc`;
    }

    const finalUploadPath = path.join(process.cwd(), uploadFolder);
    if (!fs.existsSync(finalUploadPath))
      fs.mkdirSync(finalUploadPath, { recursive: true });

    // Determine file extension based on MIME type or original file extension
    let fileExtension;
    if (mimeType && mimeToExtension[mimeType]) {
      fileExtension = mimeToExtension[mimeType];
    } else {
      // Fallback to original extension if MIME type not recognized
      const originalExt = path.extname(originalName).toLowerCase();
      fileExtension = Object.values(mimeToExtension).includes(originalExt) 
        ? originalExt 
        : '.jpg'; // Default to jpg if extension not recognized
    }

    const finalFileName = `${fileType}-${Date.now()}${fileExtension}`;
    const finalFilePath = path.join(finalUploadPath, finalFileName);

    console.log(`💾 Saving file directly to: ${finalFilePath}`);
    console.log(`📄 File type: ${mimeType}, Extension: ${fileExtension}`);

    // Write file buffer directly to final location
    fs.writeFileSync(finalFilePath, fileBuffer);

    // Verify the file was created
    if (fs.existsSync(finalFilePath)) {
      const stats = fs.statSync(finalFilePath);
      console.log(`✅ File successfully saved: ${finalFilePath} (${stats.size} bytes)`);
      
      // Get base URL from environment variable with fallback
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5713}`;
      
      // Return full URL with domain for external access
      const folderType = fileType === 'profile' ? 'profile_image' : 'id_image';
      const fileUrl = `${baseUrl}/api/images/${effectiveHotelCode}/${dateFolder}/${userFolder}/${folderType}/${finalFileName}`;
      console.log(`🔗 Full file URL to be stored: ${fileUrl}`);
      return fileUrl;
    } else {
      console.log(`❌ File was not created: ${finalFilePath}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ Direct file save failed:`, err.message);
    console.error(err.stack);
    return null;
  }
}

// ---------------- Manual Cleanup Endpoint ----------------
router.post("/cleanup-files", async (req, res) => {
  try {
    console.log('🔄 Manual file cleanup triggered...');
    await cleanupOldFiles();
    res.json({ 
      success: true, 
      message: "File cleanup completed successfully" 
    });
  } catch (err) {
    console.error('Manual cleanup error:', err);
    res.status(500).json({ 
      success: false, 
      message: "File cleanup failed", 
      error: err.message 
    });
  }
});

// ---------------- Validation Helper Functions ----------------
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateMobile = (mobile) => /^[0-9]{1,13}$/.test(mobile);
const validatePincode = (pincode) => /^[0-9]{6}$/.test(pincode);

const validateRequiredFields = (fields) => {
  const errors = [];
  if (!fields.name || fields.name.trim().length < 2)
    errors.push("Name is required and must be at least 2 characters long");
  if (!fields.email || !validateEmail(fields.email))
    errors.push("Valid email is required");
  if (!fields.mobileNo || !validateMobile(fields.mobileNo))
    errors.push("Valid mobile number is required (up to 13 digits)");
  if (!fields.nationality_id || isNaN(parseInt(fields.nationality_id)))
    errors.push("Valid nationality is required");
  if (!fields.address || fields.address.trim().length === 0)
    errors.push("Primary address is required");
  if (!fields.city_id || isNaN(parseInt(fields.city_id)))
    errors.push("Primary city is required");
  if (!fields.pincode || !validatePincode(fields.pincode))
    errors.push("Valid 6-digit primary pincode is required");
  if (!fields.off_address || fields.off_address.trim().length === 0)
    errors.push("Secondary address is required");
  if (!fields.off_city_id || isNaN(parseInt(fields.off_city_id)))
    errors.push("Secondary city is required");
  if (!fields.off_pincode || !validatePincode(fields.off_pincode))
    errors.push("Valid 6-digit secondary pincode is required");
  return errors;
};

function validateUserData(body, files) {
  const errors = {};
  const {
    fullName,
    mobileNo,
    email,
    nationality,
    address,
    city_id,
    pincode,
    off_address,
    off_city_id,
    off_pincode,
    hotel_code,
  } = body;

  if (!hotel_code?.trim()) {
    errors.hotel_code = "Hotel code is required";
  }

  if (!fullName?.trim()) errors.fullName = "Full Name is required.";
  if (!mobileNo?.trim()) errors.mobileNo = "Mobile Number is required.";
  else if (!/^\d{1,13}$/.test(mobileNo))
    errors.mobileNo = "Mobile Number must be up to 13 digits only.";
  if (!email?.trim()) errors.email = "Email is required.";
  else if (!validateEmail(email)) errors.email = "Invalid Email format";
  if (!nationality?.trim()) errors.nationality = "Nationality is required.";
  if (!address?.trim()) errors.address = "Address-1 street is required.";
  if (!city_id?.trim()) errors.city_id = "Address-1 city is required.";
  if (!/^\d{6}$/.test(pincode))
    errors.pincode = "Address-1 pincode must be exactly 6 digits.";
  if (!off_address?.trim())
    errors.off_address = "Address-2 street is required.";
  if (!off_city_id?.trim()) errors.off_city_id = "Address-2 city is required.";
  if (!/^\d{6}$/.test(off_pincode))
    errors.off_pincode = "Address-2 pincode must be exactly 6 digits.";
  if (!files?.profilePhoto?.[0])
    errors.profilePhoto = "Profile Photo is required.";

  const idTypes = Array.isArray(body.idType) ? body.idType : [body.idType];
  const idNumbers = Array.isArray(body.idNumber)
    ? body.idNumber
    : [body.idNumber];
  const idFiles = files?.idFile || [];

  if (!idTypes.length || !idNumbers.length || !idFiles.length)
    errors.idFile = "At least one ID Document is required.";
  else {
    idTypes.forEach((type, i) => {
      if (!type?.trim()) errors[`idType_${i}`] = "ID Type is required.";
    });
    idNumbers.forEach((num, i) => {
      if (!num?.trim()) errors[`idNumber_${i}`] = "ID Number is required.";
    });
  }

  return errors;
}

// ---------------- QR CODE ROUTES ----------------
router.get("/qr-codes/generate-all", async (req, res) => {
  try {
    const predefinedHotels = [
      { code: "grandhotel", name: "Grand Hotel" },
      { code: "seaside", name: "Seaside Resort" },
      { code: "mountain", name: "Mountain View" }
    ];

    const generatedQRCodes = [];

    for (const hotel of predefinedHotels) {
      try {
        const formUrl = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/userform?hotelCode=${hotel.code}`;
        
        const qrCodeDataUrl = await QRCode.toDataURL(formUrl);
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `qr_${hotel.code}_${timestamp}.png`;
        const filePath = path.join(process.cwd(), "qr-codes", filename);
        const qrDir = path.join(process.cwd(), "qr-codes");

        if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
        fs.writeFileSync(filePath, base64Data, "base64");

        generatedQRCodes.push({
          hotelCode: hotel.code,
          hotelName: hotel.name,
          fileName: filename,
          qrImageUrl: `/api/qr-codes/download/${filename}`,
          generatedTime: new Date().toISOString(),
          formUrl: formUrl
        });
      } catch (error) {
        console.error(`Failed to generate QR for ${hotel.code}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Generated ${generatedQRCodes.length} QR codes`,
      qrCodes: generatedQRCodes
    });
  } catch (err) {
    console.error("QR generation error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate QR codes", 
      error: err.message 
    });
  }
});

router.post("/qr-codes/generate", async (req, res) => {
  try {
    const { hotelCode, hotelName } = req.body;
    
    if (!hotelCode) {
      return res.status(400).json({
        success: false,
        message: "Hotel code is required"
      });
    }

    const formUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/userform?hotelCode=${hotelCode}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(formUrl);
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `qr_${hotelCode}_${timestamp}.png`;
    const filePath = path.join(process.cwd(), "qr-codes", filename);
    const qrDir = path.join(process.cwd(), "qr-codes");

    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    fs.writeFileSync(filePath, base64Data, "base64");

    res.json({
      success: true,
      message: `QR code for ${hotelName || hotelCode} generated successfully`,
      qrCode: {
        hotelCode: hotelCode,
        hotelName: hotelName || hotelCode,
        fileName: filename,
        qrImageUrl: `/api/qr-codes/download/${filename}`,
        generatedTime: new Date().toISOString(),
        formUrl: formUrl
      }
    });
  } catch (err) {
    console.error("Single QR generation error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate QR code", 
      error: err.message 
    });
  }
});

router.get("/qr-codes/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), "qr-codes", filename);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "QR code not found" });
    res.download(filePath, filename);
  } catch (err) {
    console.error("QR download error:", err);
    res.status(500).json({ message: "Failed to download QR code", error: err.message });
  }
});

router.get("/qr-codes/list", (req, res) => {
  try {
    const qrDir = path.join(process.cwd(), "qr-codes");
    if (!fs.existsSync(qrDir)) return res.json({ success: true, qrCodes: [] });

    const files = fs
      .readdirSync(qrDir)
      .filter((file) => file.startsWith("qr_") && file.endsWith(".png"))
      .map((file) => {
        const filePath = path.join(qrDir, file);
        const stats = fs.statSync(filePath);
        // Extract hotel code from filename (qr_{hotelcode}_{timestamp}.png)
        const hotelCodeMatch = file.match(/^qr_([^_]+)_/);
        const hotelCode = hotelCodeMatch ? hotelCodeMatch[1] : "unknown";
        
        return {
          fileName: file,
          hotelCode: hotelCode,
          qrImageUrl: `/api/qr-codes/download/${file}`,
          generatedTime: stats.birthtime,
          size: stats.size,
        };
      })
      .sort((a, b) => new Date(b.generatedTime) - new Date(a.generatedTime));

    res.json({ success: true, qrCodes: files });
  } catch (err) {
    console.error("QR list error:", err);
    res.status(500).json({ success: false, message: "Failed to list QR codes", error: err.message });
  }
});

router.delete("/qr-codes/delete/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), "qr-codes", filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: "QR code deleted successfully",
      deletedFile: filename
    });
  } catch (err) {
    console.error("QR delete error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete QR code", 
      error: err.message 
    });
  }
});

// ---------------- USER CRUD ROUTES (Updated for Direct Storage) ----------------
router.post(
  "/insert",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "idFile", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      console.log("Received form data:", req.body);
      console.log("Received files:", req.files);

      const errors = validateUserData(req.body, req.files);
      if (Object.keys(errors).length > 0) {
        console.log("Validation errors:", errors);
        return res.status(400).json({ message: "Validation errors", errors });
      }

      const {
        fullName,
        mobileNo,
        email,
        nationality,
        address,
        city_id,
        pincode,
        off_address,
        off_city_id,
        off_pincode,
        mac_id,
        hotel_code,
      } = req.body;

      console.log("Hotel code from form:", hotel_code);

      const idTypes = Array.isArray(req.body.idType)
        ? req.body.idType
        : [req.body.idType];
      const idNumbers = Array.isArray(req.body.idNumber)
        ? req.body.idNumber
        : [req.body.idNumber];
      const idFiles = req.files.idFile || [];
      const profileFile = req.files.profilePhoto[0];

      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().split(" ")[0];
      const pool = await poolPromise;
      const mobileTrimmed = mobileNo.trim();
      const emailTrimmed = email.trim().toLowerCase();
      const userName = fullName.trim().replace(/\s+/g, "_");
      
      const effectiveHotelCode = hotel_code || 
                                req.query.hotelCode || 
                                process.env.HOTEL_CODE || 
                                "grandhotel";

      console.log("Effective hotel code to be stored:", effectiveHotelCode);

      // Check for duplicate mobile or email
      const duplicateCheck = await pool
        .request()
        .input("mobile_no", sql.NVarChar, mobileTrimmed)
        .input("email", sql.NVarChar, emailTrimmed)
        .query(
          `SELECT mobile_no, email FROM Users WHERE LTRIM(RTRIM(mobile_no)) = @mobile_no OR LOWER(LTRIM(RTRIM(email))) = @email`
        );

      if (duplicateCheck.recordset.length > 0) {
        const existingMobile = duplicateCheck.recordset.some(
          (r) => r.mobile_no?.trim() === mobileTrimmed
        );
        const existingEmail = duplicateCheck.recordset.some(
          (r) => r.email?.trim().toLowerCase() === emailTrimmed
        );
        const messages = [];
        if (existingMobile) messages.push("Mobile number already exists");
        if (existingEmail) messages.push("Email already exists");
        return res.status(400).json({ message: messages.join(" & ") });
      }

      const transaction = pool.transaction();
      await transaction.begin();

      try {
        const userResult = await transaction
          .request()
          .input("name", sql.NVarChar, fullName.trim())
          .input("mobile_no", sql.NVarChar, mobileTrimmed)
          .input("email", sql.NVarChar, emailTrimmed)
          .input("national_id", sql.Int, parseInt(nationality))
          .input("address", sql.NVarChar, address.trim())
          .input("city_id", sql.Int, parseInt(city_id))
          .input("pincode", sql.NVarChar, pincode.trim())
          .input("off_address", sql.NVarChar, off_address.trim())
          .input("off_city_id", sql.Int, parseInt(off_city_id))
          .input("off_pincode", sql.NVarChar, off_pincode.trim())
          .input("mac_id", sql.NVarChar, mac_id?.trim() || "")
          .input("hotel_code", sql.NVarChar, effectiveHotelCode)
          .input("created_date", sql.Date, currentDate)
          .input("created_time", sql.NVarChar, currentTime)
          .query(`INSERT INTO Users (name, mobile_no, email, national_id, address, city_id, pincode, off_address, off_city_id, off_pincode, mac_id, hotel_code, created_date, created_time)
                VALUES (@name, @mobile_no, @email, @national_id, @address, @city_id, @pincode, @off_address, @off_city_id, @off_pincode, @mac_id, @hotel_code, @created_date, @created_time);
                SELECT SCOPE_IDENTITY() AS userId;`);

        const userId = userResult.recordset[0].userId;
        
        // Save profile photo directly with proper image extension
        const profileUrl = await saveFileDirectly(
          profileFile.buffer,
          profileFile.originalname,
          "profile",
          userName,
          effectiveHotelCode,
          profileFile.mimetype
        );

        if (!profileUrl) {
          await transaction.rollback();
          return res.status(500).json({ message: "Failed to save profile image" });
        }

        await transaction
          .request()
          .input("user_id", sql.Int, userId)
          .input("profile_img_path", sql.NVarChar, profileUrl)
          .query(
            `UPDATE Users SET profile_img_path = @profile_img_path WHERE user_id = @user_id`
          );

        // Save ID documents directly with proper image extensions
        const uploadedIDs = await Promise.all(
          idFiles.map((file, i) =>
            saveFileDirectly(
              file.buffer,
              file.originalname,
              "id",
              userName,
              effectiveHotelCode,
              file.mimetype
            ).then((url) => ({
              idType: parseInt(idTypes[i]),
              idNumber: idNumbers[i].trim(),
              url,
            }))
          )
        );

        // Check if any ID file failed to upload
        const failedUploads = uploadedIDs.filter(id => !id.url);
        if (failedUploads.length > 0) {
          await transaction.rollback();
          return res.status(500).json({ message: "Failed to save some ID documents" });
        }

        for (let id of uploadedIDs) {
          await transaction
            .request()
            .input("user_id", sql.Int, userId)
            .input("id_proof", sql.Int, id.idType)
            .input("id_number", sql.NVarChar, id.idNumber)
            .input("id_img_path", sql.NVarChar, id.url)
            .query(
              `INSERT INTO user_details (user_id, id_proof, id_number, id_img_path) VALUES (@user_id, @id_proof, @id_number, @id_img_path)`
            );
        }

        await transaction.commit();
        res.json({
          message: "User and ID proofs inserted successfully!",
          userId: userId,
          hotelCode: effectiveHotelCode,
          profileImage: profileUrl
        });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
  }
);

router.get("/getAllUsers", async (req, res) => {
  try {
    const { hotel_code } = req.query;
    const pool = await poolPromise;
    let query = `
      SELECT u.user_id, u.name, u.mobile_no as mobileNo, u.email, u.national_id as nationality_id, u.hotel_code,
             n.nationality_name as nationality, u.address as address1_street, u.city_id as address1_city_id,
             c1.city_name as address1_city, u.pincode as address1_pincode, u.off_address as address2_street,
             u.off_city_id as address2_city_id, c2.city_name as address2_city, u.off_pincode as address2_pincode,
             u.profile_img_path as profilePhoto, ud.id_number, ud.id_img_path as image, ud.id_proof as proof_id, p.id_name as proofName
      FROM Users u
      LEFT JOIN mas_nationality n ON u.national_id = n.nationality_id
      LEFT JOIN mas_city c1 ON u.city_id = c1.city_id
      LEFT JOIN mas_city c2 ON u.off_city_id = c2.city_id
      LEFT JOIN user_details ud ON u.user_id = ud.user_id
      LEFT JOIN mas_idproof p ON ud.id_proof = p.proof_id
    `;
    const request = pool.request();
    if (hotel_code) {
      query += ` WHERE u.hotel_code = @hotel_code`;
      request.input("hotel_code", sql.NVarChar, hotel_code);
    }
    query += ` ORDER BY u.user_id DESC`;

    const result = await request.query(query);
    const usersMap = {};

    result.recordset.forEach((row) => {
      if (!usersMap[row.user_id]) {
        usersMap[row.user_id] = {
          userId: row.user_id,
          name: row.name,
          mobileNo: row.mobileNo,
          email: row.email,
          nationality: row.nationality,
          nationality_id: row.nationality_id,
          hotelCode: row.hotel_code,
          address1: {
            street: row.address1_street,
            city: row.address1_city,
            city_id: row.address1_city_id,
            pincode: row.address1_pincode,
          },
          address2: {
            street: row.address2_street,
            city: row.address2_city,
            city_id: row.address2_city_id,
            pincode: row.address2_pincode,
          },
          profilePhoto: row.profilePhoto,
          idDocuments: [],
        };
      }
      if (row.proofName && row.id_number) {
        const existingDoc = usersMap[row.user_id].idDocuments.find(
          (doc) =>
            doc.number === row.id_number && doc.proofName === row.proofName
        );
        if (!existingDoc)
          usersMap[row.user_id].idDocuments.push({
            proofName: row.proofName,
            proof_id: row.proof_id,
            number: row.id_number,
            image: row.image,
          });
      }
    });

    const users = Object.values(usersMap).map((user) => ({
      ...user,
      idDocuments: user.idDocuments || [],
    }));
    res.json(users);
  } catch (err) {
    console.error("Fetch users failed:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

router.put(
  "/update/:id",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "idFile", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const {
        name,
        email,
        mobileNo,
        nationality_id,
        profilePhoto,
        address,
        city_id,
        pincode,
        off_address,
        off_city_id,
        off_pincode,
        idDocuments,
        hotel_code,
      } = req.body;

      const parsedData = {
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        mobileNo: mobileNo?.trim(),
        nationality_id: parseInt(nationality_id),
        profilePhoto: profilePhoto,
        address: address?.trim(),
        city_id: parseInt(city_id),
        pincode: pincode?.trim(),
        off_address: off_address?.trim(),
        off_city_id: parseInt(off_city_id),
        off_pincode: off_pincode?.trim(),
        hotel_code: hotel_code,
      };

      const userName = parsedData.name.replace(/\s+/g, "_");
      let parsedIdDocuments = [];
      try {
        parsedIdDocuments =
          typeof idDocuments === "string"
            ? JSON.parse(idDocuments)
            : idDocuments || [];
        parsedIdDocuments = parsedIdDocuments
          .map((doc) => ({
            ...doc,
            proof_id: parseInt(doc.idType || doc.proof_id),
            idNumber: doc.idNumber?.toString().trim(),
            image: doc.image,
          }))
          .filter((doc) => !isNaN(doc.proof_id) && doc.proof_id > 0);
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid ID documents format" });
      }

      const validationErrors = validateRequiredFields(parsedData);
      if (validationErrors.length > 0)
        return res.status(400).json({ message: "Validation failed", errors: validationErrors });

      const pool = await poolPromise;
      const transaction = pool.transaction();
      await transaction.begin();

      try {
        const existingUser = await transaction
          .request()
          .input("user_id", sql.Int, userId)
          .query("SELECT * FROM Users WHERE user_id = @user_id");
        if (existingUser.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({ message: "User not found" });
        }

        const duplicateCheck = await transaction
          .request()
          .input("user_id", sql.Int, userId)
          .input("email", sql.NVarChar, parsedData.email)
          .input("mobile_no", sql.NVarChar, parsedData.mobileNo)
          .query(
            `SELECT user_id FROM Users WHERE (LOWER(LTRIM(RTRIM(email))) = @email OR LTRIM(RTRIM(mobile_no)) = @mobile_no) AND user_id != @user_id`
          );
        if (duplicateCheck.recordset.length > 0) {
          await transaction.rollback();
          return res.status(400).json({ message: "Email or mobile number already exists for another user" });
        }

        const profileFile = req.files?.profilePhoto?.[0];
        let finalProfilePhoto = parsedData.profilePhoto;
        if (profileFile) {
          const uploadedUrl = await saveFileDirectly(
            profileFile.buffer,
            profileFile.originalname,
            "profile",
            userName,
            parsedData.hotel_code,
            profileFile.mimetype
          );
          if (uploadedUrl) finalProfilePhoto = uploadedUrl;
        }

        const updateFields = {
          name: parsedData.name,
          mobile_no: parsedData.mobileNo,
          email: parsedData.email,
          national_id: parsedData.nationality_id,
          address: parsedData.address,
          city_id: parsedData.city_id,
          pincode: parsedData.pincode,
          off_address: parsedData.off_address,
          off_city_id: parsedData.off_city_id,
          off_pincode: parsedData.off_pincode,
          profile_img_path: finalProfilePhoto,
          hotel_code: parsedData.hotel_code,
        };

        const setClauses = [];
        const request = transaction.request();
        request.input("user_id", sql.Int, userId);
        Object.keys(updateFields).forEach((field) => {
          if (updateFields[field] !== undefined && updateFields[field] !== null) {
            setClauses.push(`${field} = @${field}`);
            if (field === "national_id" || field === "city_id" || field === "off_city_id")
              request.input(field, sql.Int, updateFields[field]);
            else request.input(field, sql.NVarChar, updateFields[field]);
          }
        });

        if (setClauses.length > 0)
          await request.query(
            `UPDATE Users SET ${setClauses.join(", ")} WHERE user_id = @user_id`
          );
        await transaction
          .request()
          .input("user_id", sql.Int, userId)
          .query("DELETE FROM user_details WHERE user_id = @user_id");

        if (parsedIdDocuments.length > 0) {
          const idFiles = req.files?.idFile || [];
          for (let i = 0; i < parsedIdDocuments.length; i++) {
            const doc = parsedIdDocuments[i];
            let finalImageUrl = doc.image;
            if (idFiles[i]) {
              const uploadedUrl = await saveFileDirectly(
                idFiles[i].buffer,
                idFiles[i].originalname,
                "id",
                userName,
                parsedData.hotel_code,
                idFiles[i].mimetype
              );
              if (uploadedUrl) finalImageUrl = uploadedUrl;
            }
            if (finalImageUrl && doc.idNumber) {
              await transaction
                .request()
                .input("user_id", sql.Int, userId)
                .input("id_proof", sql.Int, doc.proof_id)
                .input("id_number", sql.NVarChar, doc.idNumber)
                .input("id_img_path", sql.NVarChar, finalImageUrl)
                .query(
                  `INSERT INTO user_details (user_id, id_proof, id_number, id_img_path) VALUES (@user_id, @id_proof, @id_number, @id_img_path)`
                );
            }
          }
        }

        await transaction.commit();
        res.json({
          message: "User updated successfully!",
          userId: userId,
          hotelCode: parsedData.hotel_code,
        });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
  }
);

router.delete("/delete/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pool = await poolPromise;
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const userCheck = await transaction
        .request()
        .input("user_id", sql.Int, userId)
        .query("SELECT user_id FROM Users WHERE user_id = @user_id");
      if (userCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: "User not found" });
      }
      await transaction
        .request()
        .input("user_id", sql.Int, userId)
        .query("DELETE FROM user_details WHERE user_id = @user_id");
      await transaction
        .request()
        .input("user_id", sql.Int, userId)
        .query("DELETE FROM Users WHERE user_id = @user_id");
      await transaction.commit();
      res.json({ message: "User deleted successfully!", userId: userId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pool = await poolPromise;
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
      SELECT u.user_id, u.name, u.mobile_no as mobileNo, u.email, u.national_id as nationality_id, u.hotel_code,
             n.nationality_name as nationality, u.address as address1_street, u.city_id as address1_city_id,
             c1.city_name as address1_city, u.pincode as address1_pincode, u.off_address as address2_street,
             u.off_city_id as address2_city_id, c2.city_name as address2_city, u.off_pincode as address2_pincode,
             u.profile_img_path as profilePhoto, ud.id_number, ud.id_img_path as image, ud.id_proof as proof_id, p.id_name as proofName
      FROM Users u
      LEFT JOIN mas_nationality n ON u.national_id = n.nationality_id
      LEFT JOIN mas_city c1 ON u.city_id = c1.city_id
      LEFT JOIN mas_city c2 ON u.off_city_id = c2.city_id
      LEFT JOIN user_details ud ON u.user_id = ud.user_id
      LEFT JOIN mas_idproof p ON ud.id_proof = p.proof_id
      WHERE u.user_id = @user_id
    `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = {
      userId: result.recordset[0].user_id,
      name: result.recordset[0].name,
      mobileNo: result.recordset[0].mobileNo,
      email: result.recordset[0].email,
      nationality: result.recordset[0].nationality,
      nationality_id: result.recordset[0].nationality_id,
      hotelCode: result.recordset[0].hotel_code,
      address1: {
        street: result.recordset[0].address1_street,
        city: result.recordset[0].address1_city,
        city_id: result.recordset[0].address1_city_id,
        pincode: result.recordset[0].address1_pincode,
      },
      address2: {
        street: result.recordset[0].address2_street,
        city: result.recordset[0].address2_city,
        city_id: result.recordset[0].address2_city_id,
        pincode: result.recordset[0].address2_pincode,
      },
      profilePhoto: result.recordset[0].profilePhoto,
      idDocuments: [],
    };

    result.recordset.forEach((row) => {
      if (row.proofName && row.id_number)
        user.idDocuments.push({
          proofName: row.proofName,
          proof_id: row.proof_id,
          number: row.id_number,
          image: row.image,
        });
    });

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
});

router.get("/dropdown/data", async (req, res) => {
  try {
    const pool = await poolPromise;
    const [nationalities, cities, idProofs] = await Promise.all([
      pool
        .request()
        .query(
          "SELECT nationality_id, nationality_name FROM mas_nationality ORDER BY nationality_name"
        ),
      pool
        .request()
        .query("SELECT city_id, city_name FROM mas_city ORDER BY city_name"),
      pool
        .request()
        .query("SELECT proof_id, id_name FROM mas_idproof ORDER BY id_name"),
    ]);
    res.json({
      nationalities: nationalities.recordset,
      cities: cities.recordset,
      idProofs: idProofs.recordset,
    });
  } catch (err) {
    console.error("Dropdown data error:", err);
    res.status(500).json({ message: "Failed to fetch dropdown data", error: err.message });
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const { hotel_code } = req.body;
    const effectiveHotelCode = hotel_code || "grandhotel";
    const uploadedUrl = await saveFileDirectly(
      req.file.buffer,
      req.file.originalname,
      "misc",
      null,
      effectiveHotelCode,
      req.file.mimetype
    );
    if (!uploadedUrl)
      return res.status(500).json({ message: "Failed to upload file to local storage" });
    res.json({
      message: "File uploaded successfully",
      url: uploadedUrl,
      hotelCode: effectiveHotelCode,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "File upload failed", error: err.message });
  }
});

router.get("/check-duplicate", async (req, res) => {
  try {
    const { field, value } = req.query;
    if (!field || !value)
      return res.status(400).json({ message: "Field and value are required" });
    const validFields = ["mobile_no", "email"];
    if (!validFields.includes(field))
      return res.status(400).json({ message: "Invalid field" });

    const pool = await poolPromise;
    let query = `SELECT user_id FROM Users WHERE `;
    if (field === "email")
      query += `LOWER(LTRIM(RTRIM(email))) = LOWER(LTRIM(RTRIM(@value)))`;
    else query += `LTRIM(RTRIM(mobile_no)) = LTRIM(RTRIM(@value))`;

    const result = await pool
      .request()
      .input("value", sql.NVarChar, value.trim())
      .query(query);
    res.json({
      exists: result.recordset.length > 0,
      count: result.recordset.length,
    });
  } catch (err) {
    console.error("Check duplicate error:", err);
    res.status(500).json({ message: "Failed to check duplicate", error: err.message });
  }
});

router.get("/hotel/:hotel_code", async (req, res) => {
  try {
    const { hotel_code } = req.params;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("hotel_code", sql.NVarChar, hotel_code).query(`
      SELECT u.user_id, u.name, u.mobile_no as mobileNo, u.email, u.hotel_code, u.profile_img_path as profilePhoto, COUNT(ud.user_id) as id_document_count
      FROM Users u LEFT JOIN user_details ud ON u.user_id = ud.user_id
      WHERE u.hotel_code = @hotel_code
      GROUP BY u.user_id, u.name, u.mobile_no, u.email, u.hotel_code, u.profile_img_path
      ORDER BY u.user_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Get users by hotel error:", err);
    res.status(500).json({ message: "Failed to fetch users by hotel", error: err.message });
  }
});

// Export the cleanup function for manual testing if needed
export { cleanupOldFiles };

export default router;