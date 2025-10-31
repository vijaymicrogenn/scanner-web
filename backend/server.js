import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

import proofRoutes from "./routes/proofRoutes.js";
import nationalityRoutes from "./routes/nationality.js";
import cityRoutes from "./routes/City.js";
import userRoutes from "./routes/user.js";
import authRoutes from "./routes/authRoutes.js";
import qrRoutes from "./routes/qrGenerator.js";
import validateHotelCode from "./middleware/validateHotelCode.js";

const app = express();
const PORT = 5000;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =================== MIDDLEWARE ===================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve uploaded images from images directory
app.use('/api/images', express.static(path.join(__dirname, 'images')));


// =================== HOTEL CODE VALIDATION MIDDLEWARE ===================
app.use(validateHotelCode); // Add this line

// =================== ROUTES ===================
app.get("/", (req, res) => res.send("✅ Backend server is running"));

app.use("/api/idproof", proofRoutes);
app.use("/api/nationality", nationalityRoutes);
app.use("/api/city", cityRoutes);
app.use("/api/user", userRoutes);
app.use("/api", authRoutes);
app.use("/api/qr-codes", qrRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found. Check the URL and method." });
});

// 500
app.use((err, req, res, next) => {
  console.error("❌ INTERNAL SERVER ERROR:", err.stack);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// =================== START SERVER ===================
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  const ip = getLocalIP();
  console.log(`🚀 Server running at:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Network: http://${ip}:${PORT}`);
  console.log("CORS is open for all origins (*)");
  console.log("QR Code routes available at: /api/qr-codes");
  console.log("Hotel code validation middleware is ACTIVE");
  console.log("Static image serving available at: /api/images");
});