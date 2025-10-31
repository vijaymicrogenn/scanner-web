import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import {
  Box,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
  Chip,
  Alert,
  Card,
  CardContent,
  Paper,
  ListItemIcon,
  Badge,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import HotelIcon from "@mui/icons-material/Hotel";
import WarningIcon from "@mui/icons-material/Warning";
import BlockIcon from "@mui/icons-material/Block";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ErrorIcon from "@mui/icons-material/Error";
import DescriptionIcon from "@mui/icons-material/Description";
import IdCardIcon from "@mui/icons-material/CreditCard";

const commonTextFieldProps = {
  fullWidth: true,
  variant: "outlined",
  margin: "normal",
  size: "small",
  required: true,
};

export default function UserForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNo: "",
    email: "",
    nationality: "",
    nationalityText: "",
    address1: { street: "", city_id: "", cityText: "", pincode: "" },
    address2: { street: "", city_id: "", cityText: "", pincode: "" },
    idProofs: [
      {
        idType: "",
        idTypeText: "",
        idNumber: "",
        file: null,
        previewUrl: null,
      },
    ],
    hotelCode: "",
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [idProofTypes, setIdProofTypes] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [cities, setCities] = useState([]);
  const [sameAsAddress1, setSameAsAddress1] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cameraOpen, setCameraOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [currentHotel, setCurrentHotel] = useState(null);
  const [isValidHotelCode, setIsValidHotelCode] = useState(false);
  const [isHotelCodeGenerated, setIsHotelCodeGenerated] = useState(false);
  const [checkingHotelCode, setCheckingHotelCode] = useState(true);
  const [hotelCheckError, setHotelCheckError] = useState("");
  const [idCameraOpen, setIdCameraOpen] = useState(false);
  const [currentIdIndex, setCurrentIdIndex] = useState(null);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const idVideoRef = useRef(null);
  const idCanvasRef = useRef(null);

  // Get hotel code from URL parameters and validate it
  useEffect(() => {
    const validateHotelCode = async (hotelCode) => {
      setCheckingHotelCode(true);
      setHotelCheckError("");

      try {
        // Check if the hotel code is valid and generated
        const response = await axios.get(
          `/api/qr-codes/check-code/${hotelCode}`
        );

        if (response.data.success) {
          setIsValidHotelCode(response.data.isValid);
          setIsHotelCodeGenerated(response.data.isGenerated);

          if (!response.data.isValid) {
            setHotelCheckError(`"${hotelCode}" is not a valid hotel code.`);
          } else if (!response.data.isGenerated) {
            setHotelCheckError(
              `QR code for "${hotelCode}" has not been generated yet.`
            );
          } else {
            // Hotel code is valid and generated - proceed
            setFormData((prev) => ({
              ...prev,
              hotelCode: hotelCode,
            }));
            fetchHotelDetails(hotelCode);
          }
        }
      } catch (error) {
        console.error("Error validating hotel code:", error);
        setHotelCheckError("Error validating hotel code. Please try again.");
        setIsValidHotelCode(false);
        setIsHotelCodeGenerated(false);
      } finally {
        setCheckingHotelCode(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const hotelCode = urlParams.get("hotelCode");

    console.log("URL Hotel Code:", hotelCode);

    if (hotelCode) {
      validateHotelCode(hotelCode);
    } else {
      // If no hotel code in URL, show error
      setHotelCheckError("No hotel code provided in URL.");
      setCheckingHotelCode(false);
      setIsValidHotelCode(false);
      setIsHotelCodeGenerated(false);
    }

    // Load dropdown data
    axios
      .get("/api/user/dropdown/data")
      .then((res) => {
        if (res.data.idProofs) setIdProofTypes(res.data.idProofs);
        if (res.data.nationalities) setNationalities(res.data.nationalities);
        if (res.data.cities) setCities(res.data.cities);
      })
      .catch(console.error);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (idVideoRef.current?.srcObject) {
        idVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // Fetch hotel details based on code
  const fetchHotelDetails = async (hotelCode) => {
    try {
      // First get predefined hotels to find the matching one
      const response = await axios.get("/api/qr-codes/predefined-hotels");
      const predefinedHotels = response.data.predefinedHotels || [];

      const hotel = predefinedHotels.find((h) => h.code === hotelCode);

      if (hotel) {
        setCurrentHotel({
          code: hotel.code,
          name: hotel.name,
        });
      } else {
        setCurrentHotel({
          code: hotelCode,
          name:
            hotelCode.charAt(0).toUpperCase() + hotelCode.slice(1) + " Hotel",
        });
      }

      // Save to localStorage for future use
      localStorage.setItem("lastHotelCode", hotelCode);
    } catch (error) {
      console.error("Error fetching hotel details:", error);
      setCurrentHotel({
        code: hotelCode,
        name: hotelCode.charAt(0).toUpperCase() + hotelCode.slice(1) + " Hotel",
      });
    }
  };

  // Camera functions for ID proofs
  const startIdCamera = async (index) => {
    try {
      setCurrentIdIndex(index);
      setIdCameraOpen(true);
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (idVideoRef.current) {
        idVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Cannot access camera. Please check permissions and try again.");
      setIdCameraOpen(false);
    }
  };

  const stopIdCamera = () => {
    if (idVideoRef.current?.srcObject) {
      idVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIdCameraOpen(false);
    setCurrentIdIndex(null);
  };

  const captureIdPhoto = () => {
    if (idVideoRef.current && idCanvasRef.current && currentIdIndex !== null) {
      const video = idVideoRef.current;
      const canvas = idCanvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], `id-proof-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });

            const compressedFile = await compressFile(file);

            // Update the specific ID proof
            const newProofs = [...formData.idProofs];
            if (newProofs[currentIdIndex]?.previewUrl) {
              try {
                URL.revokeObjectURL(newProofs[currentIdIndex].previewUrl);
              } catch {}
            }

            newProofs[currentIdIndex] = {
              ...newProofs[currentIdIndex],
              file: compressedFile,
              previewUrl: URL.createObjectURL(compressedFile),
            };

            setFormData((prev) => ({ ...prev, idProofs: newProofs }));
            setErrors((prev) => ({
              ...prev,
              [`idProofs_${currentIdIndex}_file`]: "",
            }));
            setValidationErrors([]);

            stopIdCamera();
          }
        },
        "image/jpeg",
        0.8
      );
    }
  };

  // Show loading or error state if hotel code is not valid/generated
  if (checkingHotelCode) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Validating hotel code...
        </Typography>
      </Box>
    );
  }

  if (!isValidHotelCode || !isHotelCodeGenerated) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: "center",
            backgroundColor: "#fff3e0",
          }}
        >
          <BlockIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {hotelCheckError || "Invalid hotel code access"}
          </Typography>

          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1">
              This hotel code is not valid or QR code has not been generated.
            </Typography>
          </Alert>

          <Box
            sx={{ mt: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
          >
            <Typography variant="body2" color="textSecondary">
              <strong>What to do:</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              1. Make sure you scanned a valid QR code
            </Typography>
            <Typography variant="body2" color="textSecondary">
              2. Contact the hotel administrator
            </Typography>
            <Typography variant="body2" color="textSecondary">
              3. Ensure QR code has been generated in the QR Code Manager
            </Typography>
          </Box>

          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => (window.location.href = "/")}
          >
            Return to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  // Validation functions
  const validateAllFields = () => {
    const newErrors = {};
    const validationMessages = [];

    // Hotel Code Validation
    if (!formData.hotelCode.trim()) {
      newErrors.hotelCode = "Hotel code is required";
      validationMessages.push("Hotel code is required");
    }

    // Personal Information Validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required";
      validationMessages.push("First Name is required");
    } else if (!/^[A-Za-z\s]+$/.test(formData.firstName)) {
      newErrors.firstName = "Only letters and spaces allowed";
      validationMessages.push(
        "First Name should contain only letters and spaces"
      );
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required";
      validationMessages.push("Last Name is required");
    } else if (!/^[A-Za-z\s]+$/.test(formData.lastName)) {
      newErrors.lastName = "Only letters and spaces allowed";
      validationMessages.push(
        "Last Name should contain only letters and spaces"
      );
    }

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile Number is required";
      validationMessages.push("Mobile Number is required");
    } else if (!/^[0-9]{10,13}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = "Mobile Number must be 10-13 digits";
      validationMessages.push("Mobile Number must be 10-13 digits");
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      validationMessages.push("Email is required");
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}(?:\.[A-Za-z]{2,})*$/.test(
        formData.email
      )
    ) {
      newErrors.email = "Invalid email format";
      validationMessages.push("Invalid email format");
    }

    // Nationality Validation
    if (!formData.nationality && !formData.nationalityText.trim()) {
      newErrors.nationality = "Nationality is required";
      validationMessages.push("Nationality is required");
    }

    // Profile Photo Validation
    if (!profilePhoto) {
      newErrors.profilePhoto = "Profile Photo is required";
      validationMessages.push("Profile Photo is required");
    }

    // Address 1 Validation
    if (!formData.address1.street.trim()) {
      newErrors.address1_street = "Street Address is required";
      validationMessages.push("Street Address is required");
    }

    if (!formData.address1.city_id && !formData.address1.cityText.trim()) {
      newErrors.address1_city = "City is required";
      validationMessages.push("City is required");
    }

    if (!formData.address1.pincode.trim()) {
      newErrors.address1_pincode = "Pincode is required";
      validationMessages.push("Pincode is required");
    } else if (!/^\d{6}$/.test(formData.address1.pincode)) {
      newErrors.address1_pincode = "Pincode must be exactly 6 digits";
      validationMessages.push("Pincode must be exactly 6 digits");
    }

    // Address 2 Validation (if not same as address1)
    if (!sameAsAddress1) {
      if (!formData.address2.street.trim()) {
        newErrors.address2_street = "Office Street Address is required";
        validationMessages.push("Office Street Address is required");
      }

      if (!formData.address2.city_id && !formData.address2.cityText.trim()) {
        newErrors.address2_city = "Office City is required";
        validationMessages.push("Office City is required");
      }

      if (!formData.address2.pincode.trim()) {
        newErrors.address2_pincode = "Office Pincode is required";
        validationMessages.push("Office Pincode is required");
      } else if (!/^\d{6}$/.test(formData.address2.pincode)) {
        newErrors.address2_pincode = "Office Pincode must be exactly 6 digits";
        validationMessages.push("Office Pincode must be exactly 6 digits");
      }
    }

    // ID Proofs Validation
    let hasValidIdProof = false;
    formData.idProofs.forEach((proof, index) => {
      if (!proof.idType && !proof.idTypeText.trim()) {
        newErrors[`idProofs_${index}_idType`] = "ID Type is required";
        if (
          !validationMessages.includes("ID Type is required for all proofs")
        ) {
          validationMessages.push("ID Type is required for all proofs");
        }
      }

      if (!proof.idNumber.trim()) {
        newErrors[`idProofs_${index}_idNumber`] = "ID Number is required";
        if (
          !validationMessages.includes("ID Number is required for all proofs")
        ) {
          validationMessages.push("ID Number is required for all proofs");
        }
      }

      if (!proof.file) {
        newErrors[`idProofs_${index}_file`] = "ID Proof file is required";
        if (
          !validationMessages.includes(
            "ID Proof file is required for all proofs"
          )
        ) {
          validationMessages.push("ID Proof file is required for all proofs");
        }
      }

      if (proof.idType && proof.idNumber.trim() && proof.file) {
        hasValidIdProof = true;
      }
      if (proof.idTypeText.trim() && proof.idNumber.trim() && proof.file) {
        hasValidIdProof = true;
      }
    });

    if (!hasValidIdProof && formData.idProofs.length > 0) {
      newErrors.idProofs = "At least one complete ID Proof is required";
      validationMessages.push("At least one complete ID Proof is required");
    }

    setErrors(newErrors);
    setValidationErrors(validationMessages);

    return Object.keys(newErrors).length === 0;
  };

  // Live validation helpers
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value) return "This field is required";
        if (!/^[A-Za-z\s]+$/.test(value))
          return "Only letters and spaces allowed";
        return "";

      case "mobileNo":
        if (!value) return "Mobile Number is required";
        if (!/^[0-9]{10,13}$/.test(value)) return "Must be 10-13 digits";
        return "";

      case "email":
        if (!value) return "Email is required";
        if (
          !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}(?:\.[A-Za-z]{2,})*$/.test(
            value
          )
        )
          return "Invalid email format";
        return "";

      case "pincode":
        if (!value) return "Pincode is required";
        if (!/^\d{6}$/.test(value)) return "Must be exactly 6 digits";
        return "";

      case "street":
        if (!value) return "Street Address is required";
        return "";

      default:
        return "";
    }
  };

  const handleInputChange = async (e, section = null) => {
    const { name, value } = e.target;
    let val = value;

    if (name === "mobileNo") val = String(val).replace(/\D/g, "").slice(0, 13);
    if (name === "pincode") val = String(val).replace(/\D/g, "").slice(0, 6);

    const errorMsg = validateField(name, val);
    setErrors((prev) => ({
      ...prev,
      [section ? `${section}_${name}` : name]: errorMsg,
    }));

    setFormData((prev) =>
      section
        ? { ...prev, [section]: { ...prev[section], [name]: val } }
        : { ...prev, [name]: val }
    );

    if (sameAsAddress1 && section === "address1") {
      setFormData((prev) => ({
        ...prev,
        address2: { ...prev.address1, [name]: val },
      }));
    }

    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleNationalityChange = (selectedValue, inputValue) => {
    if (selectedValue) {
      setFormData((prev) => ({
        ...prev,
        nationality: selectedValue,
        nationalityText: "",
      }));
    } else if (inputValue !== undefined) {
      setFormData((prev) => ({
        ...prev,
        nationality: "",
        nationalityText: inputValue,
      }));
    }
    setErrors((prev) => ({ ...prev, nationality: "" }));
    setValidationErrors([]);
  };

  const handleCityChange = (section, selectedValue, inputValue) => {
    if (selectedValue) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          city_id: selectedValue,
          cityText: "",
        },
      }));
    } else if (inputValue !== undefined) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          city_id: "",
          cityText: inputValue,
        },
      }));
    }

    if (sameAsAddress1 && section === "address1") {
      setFormData((prev) => ({
        ...prev,
        address2: {
          ...prev.address2,
          city_id: selectedValue || "",
          cityText: inputValue || "",
        },
      }));
    }

    setErrors((prev) => ({ ...prev, [`${section}_city`]: "" }));
    setValidationErrors([]);
  };

  const handleIdTypeChange = (index, selectedValue, inputValue) => {
    const newProofs = [...formData.idProofs];
    if (selectedValue) {
      newProofs[index] = {
        ...newProofs[index],
        idType: selectedValue,
        idTypeText: "",
      };
    } else if (inputValue !== undefined) {
      newProofs[index] = {
        ...newProofs[index],
        idType: "",
        idTypeText: inputValue,
      };
    }
    setFormData((prev) => ({ ...prev, idProofs: newProofs }));
    setErrors((prev) => ({ ...prev, [`idProofs_${index}_idType`]: "" }));
    setValidationErrors([]);
  };

  const compressFile = async (file) => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
      return await imageCompression(file, options);
    } catch {
      return file;
    }
  };

  const startCamera = async () => {
    try {
      setCameraOpen(true);
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Cannot access camera. Please check permissions and try again.");
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], `profile-photo-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });

            const compressedFile = await compressFile(file);

            if (profilePhoto) {
              try {
                URL.revokeObjectURL(profilePhoto.previewUrl);
              } catch {}
            }

            setProfilePhoto({
              file: compressedFile,
              previewUrl: URL.createObjectURL(compressedFile),
              source: "camera",
            });

            setErrors((prev) => ({ ...prev, profilePhoto: "" }));
            setValidationErrors([]);

            stopCamera();
          }
        },
        "image/jpeg",
        0.8
      );
    }
  };

  const triggerCamera = () => {
    startCamera();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const compressedFile = await compressFile(file);
    if (profilePhoto) {
      try {
        URL.revokeObjectURL(profilePhoto.previewUrl);
      } catch {}
    }
    setProfilePhoto({
      file: compressedFile,
      previewUrl: URL.createObjectURL(compressedFile),
      source: "gallery",
    });

    setErrors((prev) => ({ ...prev, profilePhoto: "" }));
    setValidationErrors([]);
  };

  const handleRemovePhoto = () => {
    if (profilePhoto) {
      try {
        URL.revokeObjectURL(profilePhoto.previewUrl);
      } catch {}
    }
    setProfilePhoto(null);
  };

  const handleSameAsAddress1Change = (e) => {
    const checked = e.target.checked;
    setSameAsAddress1(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, address2: { ...prev.address1 } }));
      setErrors((prev) => ({
        ...prev,
        address2_street: "",
        address2_city: "",
        address2_pincode: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        address2: { street: "", city_id: "", cityText: "", pincode: "" },
      }));
    }
    setValidationErrors([]);
  };

  const handleClear = () => {
    if (profilePhoto) {
      try {
        URL.revokeObjectURL(profilePhoto.previewUrl);
      } catch {}
    }
    formData.idProofs.forEach((p) => {
      if (p.previewUrl) {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {}
      }
    });
    setProfilePhoto(null);
    setSameAsAddress1(false);
    setErrors({});
    setValidationErrors([]);
    setFormData({
      firstName: "",
      lastName: "",
      mobileNo: "",
      email: "",
      nationality: "",
      nationalityText: "",
      address1: { street: "", city_id: "", cityText: "", pincode: "" },
      address2: { street: "", city_id: "", cityText: "", pincode: "" },
      idProofs: [
        {
          idType: "",
          idTypeText: "",
          idNumber: "",
          file: null,
          previewUrl: null,
        },
      ],
      hotelCode: formData.hotelCode, // Keep the same hotel code
    });
  };

  const handleIdProofChange = (index, field, value, filePreview = null) => {
    const newProofs = [...formData.idProofs];
    newProofs[index] = { ...newProofs[index], [field]: value };
    if (filePreview) newProofs[index].previewUrl = filePreview;
    setFormData((prev) => ({ ...prev, idProofs: newProofs }));

    if (field === "idNumber") {
      setErrors((prev) => ({ ...prev, [`idProofs_${index}_idNumber`]: "" }));
    }
    if (field === "file") {
      setErrors((prev) => ({ ...prev, [`idProofs_${index}_file`]: "" }));
    }
    setValidationErrors([]);
  };

  const handleAddProof = () =>
    setFormData((prev) => ({
      ...prev,
      idProofs: [
        ...prev.idProofs,
        {
          idType: "",
          idTypeText: "",
          idNumber: "",
          file: null,
          previewUrl: null,
        },
      ],
    }));

  const handleRemoveProof = (index) => {
    const newProofs = formData.idProofs.filter((_, i) => i !== index);
    const removed = formData.idProofs[index];
    if (removed?.previewUrl) {
      try {
        URL.revokeObjectURL(removed.previewUrl);
      } catch {}
    }
    setFormData((prev) => ({ ...prev, idProofs: newProofs }));
    setValidationErrors([]);
  };

  const getAvailableIdTypes = (currentIndex) => {
    const selectedIds = formData.idProofs.map((p) => p.idType);
    return idProofTypes.filter(
      (t) =>
        !selectedIds.includes(t.proof_id) ||
        formData.idProofs[currentIndex].idType === t.proof_id
    );
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      // Personal Information
      data.append(
        "fullName",
        `${formData.firstName} ${formData.lastName}`.trim()
      );
      data.append("mobileNo", formData.mobileNo);
      data.append("email", formData.email);

      // Add hotel_code as form field
      data.append("hotel_code", formData.hotelCode);

      console.log("Submitting with hotel code:", formData.hotelCode);

      // Nationality
      if (formData.nationality) {
        data.append("nationality", formData.nationality);
      } else if (formData.nationalityText) {
        data.append("nationality", formData.nationalityText);
      }

      // Address 1
      data.append("address", formData.address1.street);
      if (formData.address1.city_id) {
        data.append("city_id", formData.address1.city_id);
      } else if (formData.address1.cityText) {
        data.append("city_text", formData.address1.cityText);
      }
      data.append("pincode", formData.address1.pincode);

      // Address 2
      data.append("off_address", formData.address2.street);
      if (formData.address2.city_id) {
        data.append("off_city_id", formData.address2.city_id);
      } else if (formData.address2.cityText) {
        data.append("off_city_text", formData.address2.cityText);
      }
      data.append("off_pincode", formData.address2.pincode);

      // Profile Photo
      if (profilePhoto) {
        data.append("profilePhoto", profilePhoto.file);
      }

      // ID Proofs
      formData.idProofs.forEach((proof, idx) => {
        if (proof.idType) {
          data.append("idType", proof.idType);
        } else if (proof.idTypeText) {
          data.append("idTypeText", proof.idTypeText);
        }
        data.append("idNumber", proof.idNumber);
        if (proof.file) {
          data.append("idFile", proof.file);
        }
      });

      const response = await axios.post("/api/user/insert", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          hotelCode: formData.hotelCode,
        },
      });

      console.log("Submission response:", response.data);

      setOpenSuccessModal(true);
      handleClear();
    } catch (err) {
      console.error("Submission error:", err);
      console.error("Error details:", err.response?.data);
      alert(
        "Error saving data: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const getNationalityValue = () => {
    if (formData.nationality) {
      const selected = nationalities.find(
        (n) => n.nationality_id == formData.nationality
      );
      return selected ? selected.nationality_name : null;
    }
    return formData.nationalityText || null;
  };

  const getCityValue = (section) => {
    if (formData[section].city_id) {
      const selected = cities.find(
        (c) => c.city_id == formData[section].city_id
      );
      return selected ? selected.city_name : null;
    }
    return formData[section].cityText || null;
  };

  const getIdTypeValue = (index) => {
    if (formData.idProofs[index].idType) {
      const selected = idProofTypes.find(
        (p) => p.proof_id == formData.idProofs[index].idType
      );
      return selected ? selected.id_name : null;
    }
    return formData.idProofs[index].idTypeText || null;
  };

  return (
    <div className="py-3">
      <Box
        sx={{
          p: 3,
          maxWidth: 700,
          mx: "auto",
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {/* Hotel Information Card */}
        {/* {currentHotel && (
          <Card sx={{ mb: 2, backgroundColor: "#e8f5e8", border: "2px solid #4caf50" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 , }}>
                 
              
                  <Typography variant="h6" color="success.main">
                    {currentHotel.name}
                  </Typography>
                  
                  
                  
                 
              </Box>
            </CardContent>
          </Card>
        )} */}

        {/* Validation Errors Summary */}
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Profile Photo Section */}
        <Typography variant="h6" gutterBottom>
          Profile Photo *
        </Typography>
        <Box
          sx={{
            width: 200,
            height: 200,
            border: errors.profilePhoto
              ? "2px solid #d32f2f"
              : "1px solid #ccc",
            borderRadius: 1,
            mb: 3,
            mx: "auto",
            position: "relative",
            backgroundColor: "#f5f5f5",
            cursor: "pointer",
            overflow: "hidden",
          }}
          onClick={triggerCamera}
        >
          {profilePhoto ? (
            <img
              src={profilePhoto.previewUrl}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "inherit",
              }}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#666",
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2" textAlign="center">
                Take selfie
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              position: "absolute",
              bottom: 5,
              right: 5,
              gap: 0.5,
            }}
          >
            {profilePhoto && (
              <IconButton
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto();
                }}
                sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
              >
                <DeleteIcon />
              </IconButton>
            )}

            {/* Gallery Upload */}
            <IconButton
              color="primary"
              component="label"
              onClick={(e) => e.stopPropagation()}
              sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
            >
              <FolderIcon />
              <input
                type="file"
                hidden
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </IconButton>
          </Box>
        </Box>
        {errors.profilePhoto && (
          <Typography
            color="error"
            variant="caption"
            sx={{ display: "block", textAlign: "center", mb: 2 }}
          >
            {errors.profilePhoto}
          </Typography>
        )}

        {/* Camera Modal */}
        <Dialog open={cameraOpen} onClose={stopCamera} maxWidth="md" fullWidth>
          <DialogTitle>
            Take Profile Photo
            <Typography variant="body2" color="textSecondary">
              Position your face in the frame and click Capture
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 500,
                  height: 400,
                  backgroundColor: "#000",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Camera overlay frame */}
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 200,
                    height: 200,
                    border: "2px solid #fff",
                    borderRadius: "50%",
                    boxShadow: "0 0 0 4000px rgba(0,0,0,0.3)",
                  }}
                />
              </Box>
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 3 }}>
            <Button
              variant="outlined"
              onClick={stopCamera}
              startIcon={<ClearIcon />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={capturePhoto}
              startIcon={<CameraAltIcon />}
              color="primary"
            >
              Capture Photo
            </Button>
          </DialogActions>
        </Dialog>

        {/* Form Fields */}
        <TextField
          label="First Name "
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          {...commonTextFieldProps}
          error={!!errors.firstName}
          helperText={errors.firstName}
        />
        <TextField
          label="Last Name "
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          {...commonTextFieldProps}
          error={!!errors.lastName}
          helperText={errors.lastName}
        />
        <TextField
          label="Mobile No "
          name="mobileNo"
          value={formData.mobileNo}
          onChange={handleInputChange}
          {...commonTextFieldProps}
          error={!!errors.mobileNo}
          helperText={errors.mobileNo}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        />
        <TextField
          label="E-mail "
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          {...commonTextFieldProps}
          error={!!errors.email}
          helperText={errors.email}
        />

        {/* Nationality - Combo Field */}
        <Autocomplete
          freeSolo
          options={nationalities}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.nationality_name
          }
          value={getNationalityValue()}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              handleNationalityChange(null, newValue);
            } else if (newValue && newValue.nationality_id) {
              handleNationalityChange(newValue.nationality_id, null);
            } else {
              handleNationalityChange(null, "");
            }
          }}
          onInputChange={(event, newInputValue) => {
            if (!event || event.type !== "change") return;
            handleNationalityChange(null, newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Nationality "
              {...commonTextFieldProps}
              error={!!errors.nationality}
              helperText={errors.nationality}
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props}>{option.nationality_name}</MenuItem>
          )}
        />

        {/* ID Proofs Section - Elegant Design */}
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: "text.primary",

              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            ID Proofs
          </Typography>

          {formData.idProofs.map((proof, index) => (
            <Paper
              key={index}
              elevation={1}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 3,
                mb: 3,
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                {formData.idProofs.length > 1 && (
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleRemoveProof(index)}
                    sx={{ mt: -1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {/* ID Type & Number Row */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Autocomplete
                  freeSolo
                  options={getAvailableIdTypes(index)}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.id_name
                  }
                  value={getIdTypeValue(index)}
                  onChange={(event, newValue) => {
                    if (typeof newValue === "string") {
                      handleIdTypeChange(index, null, newValue);
                    } else if (newValue && newValue.proof_id) {
                      handleIdTypeChange(index, newValue.proof_id, null);
                    } else {
                      handleIdTypeChange(index, null, "");
                    }
                  }}
                  onInputChange={(event, newInputValue) => {
                    if (!event || event.type !== "change") return;
                    handleIdTypeChange(index, null, newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="ID Type"
                      {...commonTextFieldProps}
                      error={!!errors[`idProofs_${index}_idType`]}
                      helperText={errors[`idProofs_${index}_idType`]}
                      sx={{ flex: 1 }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <MenuItem {...props}>
                      <ListItemIcon>
                        <DescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      {option.id_name}
                    </MenuItem>
                  )}
                  sx={{ flex: 1 }}
                />

                <TextField
                  {...commonTextFieldProps}
                  label="ID Number"
                  value={proof.idNumber}
                  onChange={(e) =>
                    handleIdProofChange(index, "idNumber", e.target.value)
                  }
                  error={!!errors[`idProofs_${index}_idNumber`]}
                  helperText={errors[`idProofs_${index}_idNumber`]}
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Upload Section */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  color="text.primary"
                >
                  Upload ID Image *
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    mb: 1,
                  }}
                >
                  {/* File Upload */}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      borderStyle: "dashed",
                      borderWidth: 2,
                      borderColor: proof.file ? "success.main" : "primary.main",
                      backgroundColor: proof.file
                        ? "success.light"
                        : "transparent",
                      "&:hover": {
                        borderColor: "primary.dark",
                        borderWidth: 2,
                      },
                    }}
                  >
                    {proof.file
                      ? `Uploaded: ${proof.file.name}`
                      : "Choose File"}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        if (file) {
                          const compressed = await compressFile(file);
                          if (formData.idProofs[index]?.previewUrl) {
                            try {
                              
                            } catch {}
                          }
                          handleIdProofChange(
                            index,
                            "file",
                            compressed,
                            URL.createObjectURL(compressed)
                          );
                        }
                      }}
                    />
                  </Button>

                  {/* Camera Capture */}
                  <Button
                    variant="outlined"
                    startIcon={<CameraAltIcon />}
                    onClick={() => startIdCamera(index)}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      borderStyle: "dashed",
                    }}
                  >
                    Take Photo
                  </Button>
                </Box>

                {errors[`idProofs_${index}_file`] && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <ErrorIcon fontSize="small" />
                    {errors[`idProofs_${index}_file`]}
                  </Typography>
                )}
              </Box>

              {/* Preview Section */}
              {proof.previewUrl && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    backgroundColor: "grey.50",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <img
                      src={proof.previewUrl}
                      alt="ID preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Preview
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {proof.file?.name || "Camera capture"}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => window.open(proof.previewUrl, "_blank")}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          handleIdProofChange(index, "file", null);
                          handleIdProofChange(index, "previewUrl", null);
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          ))}

          <Button
            variant="outlined"
            onClick={handleAddProof}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 3,
              borderStyle: "dashed",
              borderWidth: 2,
            }}
          >
            Add Another ID Proof
          </Button>
        </Box>

        {/* Profile Photo Camera Modal */}
        <Dialog
          open={cameraOpen}
          onClose={stopCamera}
          maxWidth="xl"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              maxWidth: "95vw",
              width: "95vw",
              height: "95vh",
              margin: 0,
              borderRadius: 0,
              backgroundColor: "#000",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              borderBottom: "1px solid #333",
              textAlign: "center",
              py: 2,
            }}
          >
            <Typography variant="h5" component="div">
              Take Profile Photo
            </Typography>
            <Typography
              variant="body2"
              color="rgba(255,255,255,0.7)"
              sx={{ mt: 1 }}
            >
              Position your face in the frame and click Capture
            </Typography>
          </DialogTitle>

          <DialogContent
            sx={{
              p: 0,
              backgroundColor: "#000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Video Feed - Full Size */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />

              {/* Camera Overlay Frame */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 300,
                  height: 300,
                  border: "3px solid #fff",
                  borderRadius: "50%",
                  boxShadow: "0 0 0 4000px rgba(0,0,0,0.4)",
                  pointerEvents: "none",
                }}
              />

              {/* Capture Instructions */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 120,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  py: 1,
                }}
              >
                <Typography variant="body1" fontWeight="500">
                  Look straight into the camera
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  Ensure your face is clearly visible within the circle
                </Typography>
              </Box>
            </Box>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              gap: 3,
              py: 3,
              backgroundColor: "#000",
              borderTop: "1px solid #333",
            }}
          >
            <Button
              variant="outlined"
              onClick={stopCamera}
              startIcon={<ClearIcon />}
              sx={{
                color: "#fff",
                borderColor: "#fff",
                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
                px: 4,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={capturePhoto}
              startIcon={<CameraAltIcon sx={{ fontSize: 24 }} />}
              color="primary"
              sx={{
                px: 4,
                py: 1,
                fontSize: "1.1rem",
                backgroundColor: "#2196f3",
                "&:hover": {
                  backgroundColor: "#1976d2",
                },
              }}
            >
              Capture Photo
            </Button>
          </DialogActions>
        </Dialog>

        {/* ID Proof Camera Modal - Full Size */}
        <Dialog
          open={idCameraOpen}
          onClose={stopIdCamera}
          maxWidth="xl"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              maxWidth: "95vw",
              width: "95vw",
              height: "95vh",
              margin: 0,
              borderRadius: 0,
              backgroundColor: "#000",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              borderBottom: "1px solid #333",
              textAlign: "center",
              py: 2,
            }}
          >
            <Typography variant="h5" component="div">
              Capture ID Document
            </Typography>
            <Typography
              variant="body2"
              color="rgba(255,255,255,0.7)"
              sx={{ mt: 1 }}
            >
              Position the ID document clearly in the frame
            </Typography>
          </DialogTitle>

          <DialogContent
            sx={{
              p: 0,
              backgroundColor: "#000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Video Feed - Full Size */}
              <video
                ref={idVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />

              {/* Document Overlay Frame */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "80%",
                  height: "60%",
                  border: "3px solid #fff",
                  borderRadius: 2,
                  boxShadow: "0 0 0 4000px rgba(0,0,0,0.4)",
                  pointerEvents: "none",
                }}
              />

              {/* Document Guidelines */}
              <Box
                sx={{
                  position: "absolute",
                  top: 20,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  py: 1,
                }}
              >
                <Typography variant="body1" fontWeight="500">
                  Document Guidelines
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  Ensure the entire document fits within the frame and is
                  clearly visible
                </Typography>
              </Box>

              {/* Corner Markers for Document Alignment */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "80%",
                  height: "60%",
                  pointerEvents: "none",
                }}
              >
                {/* Top Left Corner */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -2,
                    left: -2,
                    width: 20,
                    height: 20,
                    borderTop: "3px solid #fff",
                    borderLeft: "3px solid #fff",
                  }}
                />

                {/* Top Right Corner */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderTop: "3px solid #fff",
                    borderRight: "3px solid #fff",
                  }}
                />

                {/* Bottom Left Corner */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -2,
                    left: -2,
                    width: 20,
                    height: 20,
                    borderBottom: "3px solid #fff",
                    borderLeft: "3px solid #fff",
                  }}
                />

                {/* Bottom Right Corner */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderBottom: "3px solid #fff",
                    borderRight: "3px solid #fff",
                  }}
                />
              </Box>
            </Box>

            <canvas ref={idCanvasRef} style={{ display: "none" }} />
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              gap: 3,
              py: 3,
              backgroundColor: "#000",
              borderTop: "1px solid #333",
            }}
          >
            <Button
              variant="outlined"
              onClick={stopIdCamera}
              startIcon={<ClearIcon />}
              sx={{
                color: "#fff",
                borderColor: "#fff",
                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
                px: 4,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={captureIdPhoto}
              startIcon={<CameraAltIcon sx={{ fontSize: 24 }} />}
              color="primary"
              sx={{
                px: 4,
                py: 1,
                fontSize: "1.1rem",
                backgroundColor: "#2196f3",
                "&:hover": {
                  backgroundColor: "#1976d2",
                },
              }}
            >
              Capture ID
            </Button>
          </DialogActions>
        </Dialog>
        {/* Address Sections */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Address *
        </Typography>
        <TextField
          label="Street "
          name="street"
          value={formData.address1.street}
          onChange={(e) => handleInputChange(e, "address1")}
          {...commonTextFieldProps}
          error={!!errors.address1_street}
          helperText={errors.address1_street}
        />

        {/* City - Combo Field */}
        <Autocomplete
          freeSolo
          options={cities}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.city_name
          }
          value={getCityValue("address1")}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              handleCityChange("address1", null, newValue);
            } else if (newValue && newValue.city_id) {
              handleCityChange("address1", newValue.city_id, null);
            } else {
              handleCityChange("address1", null, "");
            }
          }}
          onInputChange={(event, newInputValue) => {
            if (!event || event.type !== "change") return;
            handleCityChange("address1", null, newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="City "
              {...commonTextFieldProps}
              error={!!errors.address1_city}
              helperText={errors.address1_city}
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props}>{option.city_name}</MenuItem>
          )}
        />

        <TextField
          label="Pincode "
          name="pincode"
          value={formData.address1.pincode}
          onChange={(e) => handleInputChange(e, "address1")}
          {...commonTextFieldProps}
          type="text"
          error={!!errors.address1_pincode}
          helperText={errors.address1_pincode}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Office Address {!sameAsAddress1 && "*"}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={sameAsAddress1}
                onChange={handleSameAsAddress1Change}
              />
            }
            label="Same as Address"
          />
        </Box>
        <TextField
          label="Street "
          name="street"
          value={formData.address2.street}
          onChange={(e) => handleInputChange(e, "address2")}
          {...commonTextFieldProps}
          disabled={sameAsAddress1}
          error={!!errors.address2_street}
          helperText={errors.address2_street}
        />

        {/* Office City - Combo Field */}
        <Autocomplete
          freeSolo
          options={cities}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.city_name
          }
          value={getCityValue("address2")}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              handleCityChange("address2", null, newValue);
            } else if (newValue && newValue.city_id) {
              handleCityChange("address2", newValue.city_id, null);
            } else {
              handleCityChange("address2", null, "");
            }
          }}
          onInputChange={(event, newInputValue) => {
            if (!event || event.type !== "change") return;
            handleCityChange("address2", null, newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="City "
              {...commonTextFieldProps}
              disabled={sameAsAddress1}
              error={!!errors.address2_city}
              helperText={errors.address2_city}
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props}>{option.city_name}</MenuItem>
          )}
          disabled={sameAsAddress1}
        />

        <TextField
          label="Pincode"
          name="pincode"
          value={formData.address2.pincode}
          onChange={(e) => handleInputChange(e, "address2")}
          {...commonTextFieldProps}
          type="text"
          disabled={sameAsAddress1}
          error={!!errors.address2_pincode}
          helperText={errors.address2_pincode}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            color="success"
            endIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>

        {/* Success Modal */}
        <Dialog
          open={openSuccessModal}
          onClose={() => setOpenSuccessModal(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              padding: 1,
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              pb: 1,
              color: "success.main",
              fontSize: "1.25rem",
            }}
          >
            ✓ Registration Successful
          </DialogTitle>

          <DialogContent sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              User registration has been completed successfully!
            </Typography>

            {currentHotel && (
              <Box
                sx={{
                  backgroundColor: "success.light",
                  color: "success.dark",
                  padding: 2,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "success.main",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Registered for:
                </Typography>
                <Typography variant="body2">{currentHotel.name}</Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
            <Button
              onClick={() => setOpenSuccessModal(false)}
              variant="contained"
              color="primary"
              sx={{
                minWidth: 120,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
}
