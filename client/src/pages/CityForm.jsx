// CityForm.js - Fully Responsive
import { useState } from "react";
import axios from "axios";

export default function CityForm({ onClose, onSaved }) {
  const [formData, setFormData] = useState({ city_name: "" });
  const [toast, setToast] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ city_name: e.target.value });
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.city_name.trim()) {
      showToast("City name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/city/add", formData);
      showToast(res.data.message, "success");
      setFormData({ city_name: "" });
      if (onSaved) onSaved();
    } catch (err) {
      showToast(err.response?.data?.message || "Insert failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ city_name: "" });
    if (onClose) onClose();
  };

  return (
    <div className="container-fluid px-0">
      <div className="mb-3 mb-md-4">
        <h5 className="text-white mb-1 fw-semibold">Add City</h5>
      
      </div>

      <div className="rounded-3 p-3 p-md-4" style={{
        background: "rgba(26, 26, 46, 0.9)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        maxWidth: "500px",
        margin: "0 auto"
      }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3 mb-md-4">
            <label htmlFor="city_name" className="form-label text-light small fw-medium mb-2">
              CITY NAME
            </label>
            <input
              type="text"
              className="form-control"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                borderRadius: "6px",
                padding: "10px 12px",
                fontSize: "0.9rem"
              }}
              id="city_name"
              name="city_name"
              value={formData.city_name}
              onChange={handleChange}
              placeholder="Enter city name"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
            <button
              type="button"
              className="btn py-2 flex-fill"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn py-2 flex-fill"
              disabled={isSubmitting}
              style={{
                background: "linear-gradient(135deg, #4a90e2, #9333ea)",
                border: "none",
                color: "white",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500"
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Saving...
                </>
              ) : (
                "Save City"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast.message && (
        <div
          className={`position-fixed p-2 p-md-3 rounded-2 shadow ${
            toast.type === "success" ? "bg-success" : "bg-danger"
          }`}
          style={{
            minWidth: "250px",
            maxWidth: "90vw",
            zIndex: 9999,
            bottom: "20px",
            right: "20px",
            left: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div className="text-white fw-medium small text-center text-md-start">{toast.message}</div>
        </div>
      )}
    </div>
  );
}