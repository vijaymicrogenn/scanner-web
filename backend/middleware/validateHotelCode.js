// middleware/validateHotelCode.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generatedCodesFile = path.join(__dirname, "../data/generated-codes.json");
const hotelsDataFile = path.join(__dirname, "../data/hotels.json");

const getGeneratedCodes = () => {
  try {
    if (fs.existsSync(generatedCodesFile)) {
      const data = fs.readFileSync(generatedCodesFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading generated codes:', error);
    return [];
  }
};

const getPredefinedHotels = () => {
  try {
    if (fs.existsSync(hotelsDataFile)) {
      const data = fs.readFileSync(hotelsDataFile, 'utf8');
      const hotelsData = JSON.parse(data);
      return hotelsData.predefinedHotels || [];
    }
    return [];
  } catch (error) {
    console.error('Error reading hotels data:', error);
    return [];
  }
};

const isValidHotelCode = (hotelCode) => {
  const predefinedHotels = getPredefinedHotels();
  return predefinedHotels.some(hotel => hotel.code === hotelCode);
};

const validateHotelCode = (req, res, next) => {
  // Only check /userform routes
  if (req.path === '/userform') {
    const { hotelCode } = req.query;
    
    if (!hotelCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Hotel code is required in URL parameters" 
      });
    }

    // Check if this hotel code is valid (exists in predefined hotels)
    if (!isValidHotelCode(hotelCode)) {
      return res.status(404).json({ 
        success: false, 
        message: "Invalid hotel code",
        help: "This hotel code does not exist in our system"
      });
    }

    // Check if this hotel code has been generated
    const generatedCodes = getGeneratedCodes();
    if (!generatedCodes.includes(hotelCode)) {
      return res.status(403).json({ 
        success: false, 
        message: "QR code not generated for this hotel",
        help: "Please generate a QR code first using the QR Code Manager"
      });
    }
  }
  
  next();
};

export default validateHotelCode;