import React, { useState, useEffect } from "react";
import {
  Eye,
  Trash2,
  Edit,
  FileText,
  MapPin,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  User,
  Plus,
  Minus,
  Camera,
} from "lucide-react";
import axios from "axios";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIdModal, setShowIdModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);

  // Dropdown data states
  const [idProofTypes, setIdProofTypes] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [cities, setCities] = useState([]);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobileNo: "",
    nationality: "",
    profilePhoto: null,
    profilePhotoFile: null,
    address1: { street: "", city_id: "", pincode: "" },
    address2: { street: "", off_city_id: "", off_pincode: "" },
    idDocuments: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const API_BASE = "/api/user";

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [idProofRes, nationalityRes, cityRes] = await Promise.all([
          axios.get("/api/idproof/view"),
          axios.get("/api/nationality/view-all"),
          axios.get("/api/city/view-all"),
        ]);

        if (Array.isArray(idProofRes.data)) setIdProofTypes(idProofRes.data);
        if (Array.isArray(nationalityRes.data))
          setNationalities(nationalityRes.data);
        if (Array.isArray(cityRes.data)) setCities(cityRes.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/getAllUsers`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      showNotification("Failed to fetch users", "danger");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/delete/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        showNotification("User deleted successfully!", "success");
        fetchUsers();
      } else {
        showNotification(data.message || "Failed to delete user", "danger");
      }
    } catch (error) {
      showNotification("Error deleting user", "danger");
      console.error("Error:", error);
    }
    setDeleteConfirm(null);
  };

  // Validation functions
  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!editForm.name.trim()) {
      errors.name = "Name is required";
    } else if (editForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }

    // Email validation
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Mobile validation
    if (!editForm.mobileNo.trim()) {
      errors.mobileNo = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(editForm.mobileNo.replace(/\D/g, ""))) {
      errors.mobileNo = "Please enter a valid 10-digit mobile number";
    }

    // Nationality validation
    if (!editForm.nationality) {
      errors.nationality = "Nationality is required";
    }

    // Address 1 validation
    if (!editForm.address1.street.trim()) {
      errors["address1.street"] = "Primary address is required";
    }
    if (!editForm.address1.city_id) {
      errors["address1.city_id"] = "Primary city is required";
    }
    if (!editForm.address1.pincode.trim()) {
      errors["address1.pincode"] = "Primary pincode is required";
    } else if (!/^[0-9]{6}$/.test(editForm.address1.pincode)) {
      errors["address1.pincode"] = "Pincode must be 6 digits";
    }

    // Address 2 validation
    if (!editForm.address2.street.trim()) {
      errors["address2.street"] = "Secondary address is required";
    }
    if (!editForm.address2.off_city_id) {
      errors["address2.off_city_id"] = "Secondary city is required";
    }
    if (!editForm.address2.off_pincode.trim()) {
      errors["address2.off_pincode"] = "Secondary pincode is required";
    } else if (!/^[0-9]{6}$/.test(editForm.address2.off_pincode)) {
      errors["address2.off_pincode"] = "Pincode must be 6 digits";
    }

    // ID Documents validation
    editForm.idDocuments.forEach((doc, index) => {
      if (!doc.idType) {
        errors[`idDocuments.${index}.idType`] = "ID Type is required";
      }
      if (!doc.idNumber.trim()) {
        errors[`idDocuments.${index}.idNumber`] = "ID Number is required";
      }
      if (!doc.image) {
        errors[`idDocuments.${index}.image`] = "ID Document image is required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("File size should be less than 5MB", "danger");
        return;
      }

      if (!file.type.startsWith("image/")) {
        showNotification("Please select an image file", "danger");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setEditForm((prev) => ({
          ...prev,
          profilePhoto: e.target.result,
          profilePhotoFile: file,
        }));
        // Clear profile photo error if any
        setFormErrors((prev) => ({ ...prev, profilePhoto: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle ID document upload
  const handleIdDocumentUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("File size should be less than 5MB", "danger");
        return;
      }

      if (!file.type.startsWith("image/")) {
        showNotification("Please select an image file", "danger");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        updateIdDocument(index, "image", e.target.result);
        updateIdDocument(index, "imageFile", file);
        // Clear image error for this document
        setFormErrors((prev) => ({
          ...prev,
          [`idDocuments.${index}.image`]: undefined,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (user) => {
    setSelectedData(user);
    setFormErrors({});

    // Find nationality ID from name
    const nationalityObj = nationalities.find(
      (n) => n.nationality_name === user.nationality
    );

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      mobileNo: user.mobileNo || "",
      nationality: nationalityObj?.nationality_id || "",
      profilePhoto: user.profilePhoto || null,
      profilePhotoFile: null,
      address1: {
        street: user.address1?.street || "",
        city_id: user.address1?.city_id || "",
        pincode: user.address1?.pincode || "",
      },
      address2: {
        street: user.address2?.street || "",
        off_city_id: user.address2?.city_id || "",
        off_pincode: user.address2?.pincode || "",
      },
      idDocuments:
        user.idDocuments?.map((doc) => {
          const proofType = idProofTypes.find(
            (proof) => proof.id_name === doc.proofName
          );
          return {
            idType: proofType?.proof_id || "",
            idNumber: doc.number || "",
            image: doc.image || null,
            imageFile: null,
          };
        }) || [],
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) {
      showNotification(
        "Please fix all validation errors before submitting",
        "danger"
      );
      return;
    }

    try {
      setUploading(true);

      // Upload profile photo if changed
      let profilePhotoUrl = editForm.profilePhoto;
      if (editForm.profilePhotoFile) {
        const profileFormData = new FormData();
        profileFormData.append("profilePhoto", editForm.profilePhotoFile);

        const profileResponse = await fetch("/api/upload", {
          method: "POST",
          body: profileFormData,
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          profilePhotoUrl = profileData.url;
        }
      }

      // Upload ID documents if changed
      const updatedIdDocuments = await Promise.all(
        editForm.idDocuments.map(async (doc) => {
          if (doc.imageFile) {
            const idFormData = new FormData();
            idFormData.append("idFile", doc.imageFile);

            const idResponse = await fetch("/api/upload", {
              method: "POST",
              body: idFormData,
            });

            if (idResponse.ok) {
              const idData = await idResponse.json();
              return { ...doc, image: idData.url };
            }
          }
          return doc;
        })
      );

      const formattedData = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        mobileNo: editForm.mobileNo.replace(/\D/g, ""),
        nationality_id: editForm.nationality,
        profilePhoto: profilePhotoUrl,
        address: editForm.address1.street.trim(),
        city_id: editForm.address1.city_id,
        pincode: editForm.address1.pincode,
        off_address: editForm.address2.street.trim(),
        off_city_id: editForm.address2.off_city_id,
        off_pincode: editForm.address2.off_pincode,
        idDocuments: updatedIdDocuments.map((doc) => ({
          proof_id: doc.idType,
          idNumber: doc.idNumber.trim(),
          image: doc.image,
        })),
      };

      const response = await fetch(
        `${API_BASE}/update/${selectedData.userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedData),
        }
      );

      if (response.ok) {
        showNotification("User updated successfully!", "success");
        setShowEditModal(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        showNotification(
          errorData.message || "Failed to update user",
          "danger"
        );
      }
    } catch (error) {
      showNotification("Error updating user", "danger");
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateAddressField = (addressType, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [addressType]: { ...prev[addressType], [field]: value },
    }));
    // Clear error when field is updated
    const errorKey = `${addressType}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const updateIdDocument = (index, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      idDocuments: prev.idDocuments.map((doc, i) =>
        i === index ? { ...doc, [field]: value } : doc
      ),
    }));
    // Clear error when field is updated
    const errorKey = `idDocuments.${index}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const addIdDocument = () => {
    setEditForm((prev) => ({
      ...prev,
      idDocuments: [
        ...prev.idDocuments,
        { idType: "", idNumber: "", image: null, imageFile: null },
      ],
    }));
  };

  const removeIdDocument = (index) => {
    setEditForm((prev) => ({
      ...prev,
      idDocuments: prev.idDocuments.filter((_, i) => i !== index),
    }));
    // Remove related errors
    const newErrors = { ...formErrors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(`idDocuments.${index}`)) {
        delete newErrors[key];
      }
    });
    setFormErrors(newErrors);
  };

  const removeProfilePhoto = () => {
    setEditForm((prev) => ({
      ...prev,
      profilePhoto: null,
      profilePhotoFile: null,
    }));
  };

  const removeIdDocumentImage = (index) => {
    updateIdDocument(index, "image", null);
    updateIdDocument(index, "imageFile", null);
  };

  const openIdModal = (user) => {
    setSelectedData(user);
    setShowIdModal(true);
  };

  // Helper function to get city name by ID
  const getCityName = (cityId) => {
    const city = cities.find((c) => c.city_id == cityId);
    return city ? city.city_name : "—";
  };

  // Helper function to get nationality name by ID
  const getNationalityName = (nationalityId) => {
    const nationality = nationalities.find(
      (n) => n.nationality_id == nationalityId
    );
    return nationality ? nationality.nationality_name : "—";
  };

  // Helper function to get ID proof name by ID
  const getIdProofName = (proofId) => {
    const proof = idProofTypes.find((p) => p.proof_id == proofId);
    return proof ? proof.id_name : "—";
  };

  // Helper function to format address for display
  const formatAddress = (address, cityId) => {
    if (!address?.street) return "—";

    const cityName = getCityName(cityId);
    const pincode = address.pincode || "";

    return `${address.street}, ${cityName}${pincode ? ` - ${pincode}` : ""}`;
  };

  return (
    <div className="min-vh-100 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container py-2">
        {notification && (
          <div
            className="position-fixed top-0 end-0 m-4 p-4 rounded-3 shadow-lg text-white border-0"
            style={{
              background:
                notification.type === "success"
                  ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                  : "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
              zIndex: 9999,
              minWidth: "300px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                {notification.type === "success" ? (
                  <CheckCircle size={24} className="me-3" />
                ) : (
                  <AlertCircle size={24} className="me-3" />
                )}
                <span className="fw-semibold">{notification.message}</span>
              </div>
              <button
                className="btn-close btn-close-white"
                onClick={() => setNotification(null)}
              ></button>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700">
          <div
            className="card-header text-white py-3 border-bottom border-gray-700"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-semibold text-cyan-100">
                All Users ({users.length})
              </h4>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ backgroundColor: "rgba(30, 41, 59, 0.8)" }}>
                <tr>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    Profile
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    Name
                  </th>
                    <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    hotelcode
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    Contact
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    E mail
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    Nationality
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    Primary Address
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700">
                    Office Address
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700 text-center">
                    ID Proof
                  </th>
                  <th className="py-3 fw-semibold text-cyan-200 border-bottom border-gray-700 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center text-cyan-100 py-5 bg-gray-800 bg-opacity-50"
                    >
                      <User size={48} className="opacity-50 mb-3" />
                      <div>No users found</div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.userId}
                      className="bg-gray-800 bg-opacity-30 hover:bg-gray-700 transition-all duration-300 border-b border-gray-700"
                    >
                      <td className="border-0">
                        <img
                          src={
                            user.profilePhoto ||
                            "https://via.placeholder.com/50"
                          }
                          alt={user.name}
                          className="rounded-circle shadow-lg"
                          style={{
                            width: "55px",
                            height: "55px",
                            objectFit: "cover",
                            border: "3px solid #06b6d4",
                          }}
                        />
                      </td>
                      <td className="border-0">
                        <div className="fw-semibold text-cyan-100">
                          {user.name}
                        </div>
                      </td>
                       <td className="border-0">
                        <div className="fw-semibold text-cyan-100">
                          {user.hotelCode}
                        </div>
                      </td>
                      <td className="border-0">
                        <div className="fw-medium text-cyan-100">
                          {user.mobileNo}
                        </div>
                      </td>
                      <td className="border-0">
                        <small className="text-cyan-200">{user.email}</small>
                      </td>
                      <td className="border-0">
                        <span className="text-cyan-100">
                          {user.nationality}
                        </span>
                      </td>
                      <td className="border-0">
                        <div className="small text-cyan-200">
                          {formatAddress(user.address1, user.address1?.city_id)}
                        </div>
                      </td>
                      <td className="border-0">
                        <div className="small text-cyan-200">
                          {formatAddress(user.address2, user.address2?.city_id)}
                        </div>
                      </td>
                      <td className="text-center border-0">
                        <button
                          className="btn btn-sm shadow-lg rounded-pill px-3 border-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                            color: "white",
                          }}
                          onClick={() => openIdModal(user)}
                        >
                          <FileText size={16} className="me-1" /> (
                          {user.idDocuments.length})
                        </button>
                      </td>
                      <td className="text-center border-0">
                        <div className="btn-group shadow-lg" role="group">
                          <button
                            className="btn btn-sm text-white border-0"
                            style={{
                              background:
                                "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                            }}
                            title="Edit"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn btn-sm text-white border-0"
                            style={{
                              background:
                                "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            }}
                            title="Delete"
                            onClick={() => setDeleteConfirm(user.userId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showEditModal && selectedData && (
          <div
            className="modal  show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-2xl rounded-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500 border-opacity-20">
                <div
                  className="modal-header text-white   border-bottom border-cyan-500 border-opacity-30 py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)",
                  }}
                >
                  <h5 className="modal-title fw-semibold text-cyan-100">
                    <Edit size={24} className="me-2" /> Edit User Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4 bg-transparent">
                  {/* Personal Information Section */}
                  <div className="mb-4">
                    <h6
                      className="fw-semibold mb-3 pb-2 border-bottom border-cyan-500 border-opacity-30"
                      style={{ color: "#06b6d4" }}
                    >
                      <User size={20} className="me-2" />
                      Personal Information
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold  text-block">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors.name ? "is-invalid border-red-500" : ""
                          }`}
                          value={editForm.name}
                          onChange={(e) =>
                            updateEditForm("name", e.target.value)
                          }
                          required
                        />
                        {formErrors.name && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors.name}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-cyan-100">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors.email ? "is-invalid border-red-500" : ""
                          }`}
                          value={editForm.email}
                          onChange={(e) =>
                            updateEditForm("email", e.target.value)
                          }
                          required
                        />
                        {formErrors.email && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors.email}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-cyan-100">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors.mobileNo
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.mobileNo}
                          onChange={(e) =>
                            updateEditForm(
                              "mobileNo",
                              e.target.value.replace(/\D/g, "").slice(0, 13)
                            )
                          }
                          maxLength={10}
                          required
                        />
                        {formErrors.mobileNo && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors.mobileNo}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-cyan-100">
                          Nationality *
                        </label>
                        <select
                          className={`form-select rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors.nationality
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.nationality}
                          onChange={(e) =>
                            updateEditForm("nationality", e.target.value)
                          }
                          required
                        >
                          <option value="" className="text-gray-400">
                            Select Nationality
                          </option>
                          {nationalities.map((nationality) => (
                            <option
                              key={nationality.nationality_id}
                              value={nationality.nationality_id}
                              className="text-block"
                            >
                              {nationality.nationality_name}
                            </option>
                          ))}
                        </select>
                        {formErrors.nationality && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors.nationality}
                          </div>
                        )}
                      </div>

                      {/* Profile Photo Upload */}
                      <div className="col-12">
                        <label className="form-label fw-semibold text-cyan-100">
                          Profile Photo
                        </label>
                        <div className="d-flex align-items-start gap-4">
                          <div className="position-relative">
                            <img
                              src={
                                editForm.profilePhoto ||
                                "https://via.placeholder.com/150"
                              }
                              alt="Profile Preview"
                              className="rounded-3 shadow-lg"
                              style={{
                                width: "150px",
                                height: "150px",
                                objectFit: "cover",
                                border: "3px solid #06b6d4",
                              }}
                            />
                            {editForm.profilePhoto && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle"
                                onClick={removeProfilePhoto}
                                style={{ width: "30px", height: "30px" }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div
                              className="border-2 rounded-3 p-4 text-center bg-gray-700 bg-opacity-50"
                              style={{
                                borderColor: "#06b6d4",
                                borderStyle: "dashed",
                              }}
                            >
                              <input
                                type="file"
                                id="profilePhoto"
                                accept="image/*"
                                className="d-none"
                                onChange={handleProfilePhotoUpload}
                              />
                              <label
                                htmlFor="profilePhoto"
                                className="btn rounded-pill px-4 py-2 cursor-pointer border-0 text-white"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                }}
                              >
                                <Camera size={18} className="me-2" />
                                {editForm.profilePhoto
                                  ? "Change Photo"
                                  : "Upload Photo"}
                              </label>
                              <p className="small text-cyan-200 mt-2 mb-0">
                                JPG, PNG, WEBP (Max 5MB)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Address Section */}
                  <div className="mb-4">
                    <h6
                      className="fw-semibold mb-3 pb-2 border-bottom border-cyan-500 border-opacity-30"
                      style={{ color: "#06b6d4" }}
                    >
                      <MapPin size={20} className="me-2" />
                      Primary Address
                    </h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold text-cyan-100">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors["address1.street"]
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.address1.street}
                          onChange={(e) =>
                            updateAddressField(
                              "address1",
                              "street",
                              e.target.value
                            )
                          }
                          required
                        />
                        {formErrors["address1.street"] && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors["address1.street"]}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-cyan-100">
                          City *
                        </label>
                        <select
                          className={`form-select rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors["address1.city_id"]
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.address1.city_id}
                          onChange={(e) =>
                            updateAddressField(
                              "address1",
                              "city_id",
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="" className="text-gray-400">
                            Select City
                          </option>
                          {cities.map((city) => (
                            <option
                              key={city.city_id}
                              value={city.city_id}
                              className="text-block"
                            >
                              {city.city_name}
                            </option>
                          ))}
                        </select>
                        {formErrors["address1.city_id"] && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors["address1.city_id"]}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-cyan-100">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors["address1.pincode"]
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.address1.pincode}
                          onChange={(e) =>
                            updateAddressField(
                              "address1",
                              "pincode",
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          required
                          maxLength={6}
                        />
                        {formErrors["address1.pincode"] && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors["address1.pincode"]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Address Section */}
                  <div className="mb-4">
                    <h6
                      className="fw-semibold mb-3 pb-2 border-bottom border-cyan-500 border-opacity-30"
                      style={{ color: "#06b6d4" }}
                    >
                      <MapPin size={20} className="me-2" />
                      Secondary Address
                    </h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold text-cyan-100">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors["address2.street"]
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.address2.street}
                          onChange={(e) =>
                            updateAddressField(
                              "address2",
                              "street",
                              e.target.value
                            )
                          }
                          required
                        />
                        {formErrors["address2.street"] && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors["address2.street"]}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-cyan-100">
                          City *
                        </label>
                        <select
                          className={`form-select rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors["address2.off_city_id"]
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.address2.off_city_id}
                          onChange={(e) =>
                            updateAddressField(
                              "address2",
                              "off_city_id",
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="" className="text-gray-400">
                            Select City
                          </option>
                          {cities.map((city) => (
                            <option
                              key={city.city_id}
                              value={city.city_id}
                              className="text-block"
                            >
                              {city.city_name}
                            </option>
                          ))}
                        </select>
                        {formErrors["address2.off_city_id"] && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors["address2.off_city_id"]}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-cyan-100">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                            formErrors["address2.off_pincode"]
                              ? "is-invalid border-red-500"
                              : ""
                          }`}
                          value={editForm.address2.off_pincode}
                          onChange={(e) =>
                            updateAddressField(
                              "address2",
                              "off_pincode",
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          required
                          maxLength={6}
                        />
                        {formErrors["address2.off_pincode"] && (
                          <div className="invalid-feedback text-red-400">
                            {formErrors["address2.off_pincode"]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ID Documents Section */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-cyan-500 border-opacity-30">
                      <h6
                        className="fw-semibold mb-0 text-cyan-100"
                        style={{ color: "#06b6d4" }}
                      >
                        <FileText size={20} className="me-2" />
                        ID Documents
                      </h6>
                      <button
                        type="button"
                        className="btn btn-sm rounded-pill text-white border-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                        }}
                        onClick={addIdDocument}
                      >
                        <Plus size={16} className="me-1" />
                        Add Document
                      </button>
                    </div>

                    {editForm.idDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="card border-0 shadow-lg rounded-3 mb-3 bg-gray-700 bg-opacity-50 border border-cyan-500 border-opacity-20"
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 text-cyan-100">
                              Document {index + 1}
                            </h6>
                            {editForm.idDocuments.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger rounded-circle border-0"
                                onClick={() => removeIdDocument(index)}
                              >
                                <Minus size={16} />
                              </button>
                            )}
                          </div>
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label fw-semibold text-cyan-100">
                                ID Type *
                              </label>
                              <select
                                className={`form-select rounded-3 shadow-lg bg-gray-700 border-gray-600 text-block ${
                                  formErrors[`idDocuments.${index}.idType`]
                                    ? "is-invalid border-red-500"
                                    : ""
                                }`}
                                value={doc.idType}
                                onChange={(e) =>
                                  updateIdDocument(
                                    index,
                                    "idType",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="" className="text-gray-400">
                                  Select ID Type
                                </option>
                                {idProofTypes.map((proof) => (
                                  <option
                                    key={proof.proof_id}
                                    value={proof.proof_id}
                                    className="text-block"
                                  >
                                    {proof.id_name}
                                  </option>
                                ))}
                              </select>
                              {formErrors[`idDocuments.${index}.idType`] && (
                                <div className="invalid-feedback text-red-400">
                                  {formErrors[`idDocuments.${index}.idType`]}
                                </div>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label fw-semibold text-cyan-100">
                                ID Number *
                              </label>
                              <input
                                type="text"
                                className={`form-control rounded-3 shadow-lg bg-gray-700 border-gray-600 text-bllock ${
                                  formErrors[`idDocuments.${index}.idNumber`]
                                    ? "is-invalid border-red-500"
                                    : ""
                                }`}
                                value={doc.idNumber}
                                onChange={(e) =>
                                  updateIdDocument(
                                    index,
                                    "idNumber",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter ID number"
                              />
                              {formErrors[`idDocuments.${index}.idNumber`] && (
                                <div className="invalid-feedback text-red-400">
                                  {formErrors[`idDocuments.${index}.idNumber`]}
                                </div>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label fw-semibold text-cyan-100">
                                Document Image *
                              </label>
                              <div className="d-flex align-items-start gap-3">
                                <div className="position-relative">
                                  <img
                                    src={
                                      doc.image ||
                                      "https://via.placeholder.com/100x80?text=No+Image"
                                    }
                                    alt="Document Preview"
                                    className="rounded-2 shadow-lg"
                                    style={{
                                      width: "100px",
                                      height: "80px",
                                      objectFit: "cover",
                                      border: "2px solid #06b6d4",
                                    }}
                                  />
                                  {doc.image && (
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle border-0"
                                      onClick={() =>
                                        removeIdDocumentImage(index)
                                      }
                                      style={{ width: "24px", height: "24px" }}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                                <div className="flex-grow-1">
                                  <input
                                    type="file"
                                    id={`idDocument-${index}`}
                                    accept="image/*"
                                    className="d-none"
                                    onChange={(e) =>
                                      handleIdDocumentUpload(index, e)
                                    }
                                  />
                                  <label
                                    htmlFor={`idDocument-${index}`}
                                    className="btn btn-sm rounded-pill px-3 py-2 cursor-pointer w-100 border-0 text-white"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                    }}
                                  >
                                    <Upload size={14} className="me-1" />
                                    Change Image
                                  </label>
                                  {formErrors[`idDocuments.${index}.image`] && (
                                    <div className="text-red-400 small mt-1">
                                      {formErrors[`idDocuments.${index}.image`]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex gap-3 justify-content-end pt-3 border-top border-cyan-500 border-opacity-30">
                    <button
                      type="button"
                      className="btn px-4 py-2 rounded-pill shadow-lg border-0 text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                      }}
                      onClick={() => setShowEditModal(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn text-white px-5 py-2 rounded-pill shadow-lg fw-semibold border-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                      }}
                      onClick={handleEditSubmit}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} className="me-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ID Modal */}
        {showIdModal && selectedData && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-2xl rounded-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500 border-opacity-20">
                <div
                  className="modal-header text-white border-bottom border-cyan-500 border-opacity-30 py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                  }}
                >
                  <h5 className="modal-title fw-semibold text-cyan-100">
                    <FileText size={24} className="me-2" /> ID Documents
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowIdModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4 bg-transparent">
                  {selectedData.idDocuments.length === 0 ? (
                    <div className="text-center text-cyan-200 py-5">
                      <FileText size={48} className="opacity-50 mb-3" />
                      <p>No ID documents available</p>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {selectedData.idDocuments.map((doc, index) => (
                        <div className="col-md-6" key={index}>
                          <div className="card border-0 shadow-lg rounded-3 overflow-hidden h-100 bg-gray-700 bg-opacity-50 border border-cyan-500 border-opacity-20">
                            <img
                              src={doc.image}
                              alt={doc.type}
                              className="card-img-top"
                              style={{
                                cursor: "pointer",
                                height: "250px",
                                objectFit: "cover",
                              }}
                              onClick={() => window.open(doc.image, "_blank")}
                            />
                            <div className="card-body">
                              <span
                                className="badge rounded-pill px-3 py-2 mb-2 border-0"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                }}
                              >
                                ID Type: {doc.proofName}
                              </span>
                              <p className="font-monospace fw-bold mb-0 text-cyan-100">
                                  ID:{doc.number}
                              </p>
                            </div>
                            <div className="card-footer bg-gray-800 border-0">
                              <button
                                className="btn w-100 text-white rounded-pill shadow-lg border-0"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                }}
                                onClick={() => window.open(doc.image, "_blank")}
                              >
                                <Eye size={16} className="me-2" />
                                View Full Size
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-2xl rounded-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500 border-opacity-20">
                <div
                  className="modal-header text-white border-bottom border-red-500 border-opacity-30 py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  }}
                >
                  <h5 className="modal-title fw-semibold">
                    <AlertCircle size={24} className="me-2" /> Confirm Deletion
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setDeleteConfirm(null)}
                  ></button>
                </div>
                <div className="modal-body text-center p-5 bg-transparent">
                  <AlertCircle size={64} className="text-red-400 mb-3" />
                  <h5 className="mb-3 text-cyan-100">Are you sure?</h5>
                  <p className="text-cyan-200">
                    This action cannot be undone. The user data will be
                    permanently deleted.
                  </p>
                  <div className="d-flex gap-3 justify-content-center mt-4">
                    <button
                      className="btn px-4 py-2 rounded-pill shadow-lg border-0 text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                      }}
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn text-white px-4 py-2 rounded-pill shadow-lg border-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      }}
                      onClick={() => handleDelete(deleteConfirm)}
                    >
                      <Trash2 size={16} className="me-2" />
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
