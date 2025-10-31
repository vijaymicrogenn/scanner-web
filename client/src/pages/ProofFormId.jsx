// ProofFormId.js - Fully Responsive
import { useState } from "react";
import axios from "axios";

export default function ProofFormId({ onClose, onSaved }) {
  const [formData, setFormData] = useState({ id_name: "", short_name: "" });
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_name.trim() || !formData.short_name.trim()) {
      showToast("Both fields are required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/api/idproof/add", formData);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        if (onSaved) onSaved();
      }, 2000);
    } catch (err) {
      showToast(err.response?.data?.message || "Error inserting data", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ id_name: "", short_name: "" });
    if (onClose) onClose();
  };

  return (
    <div className="container-fluid px-0">
      {/* Success Animation Popup */}
      {showSuccessPopup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{ 
              zIndex: 9999, 
              backgroundColor: "rgba(0,0,0,0.8)" 
            }}>
          <div className="rounded-3 p-4 text-center shadow-lg" style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            border: "1px solid rgba(255,255,255,0.15)",
            maxWidth: "320px",
            width: "100%"
          }}>
            <div className="text-success mb-3">
              <i className="fas fa-check-circle" style={{ fontSize: "2.5rem" }}></i>
            </div>
            <h5 className="text-white mb-2">Success!</h5>
            <p className="text-light small mb-3">ID Proof added successfully</p>
            <div className="spinner-border text-primary spinner-border-sm" role="status">
              <span className="visually-hidden">Redirecting...</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3 mb-md-4">
        <h5 className="text-white mb-1 fw-semibold">Add ID Proof</h5>
       
      </div>

      <div className={`rounded-3 p-3 p-md-4 ${showSuccessPopup ? 'blur-background' : ''}`} style={{
        background: "rgba(26, 26, 46, 0.9)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        maxWidth: "500px",
        margin: "0 auto"
      }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3 mb-md-4">
            <label htmlFor="id_name" className="form-label text-light small fw-medium mb-2">
              ID NAME
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
              id="id_name"
              name="id_name"
              value={formData.id_name}
              onChange={handleChange}
              placeholder="e.g. Aadhaar Card"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="mb-3 mb-md-4">
            <label htmlFor="short_name" className="form-label text-light small fw-medium mb-2">
              SHORT NAME
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
              id="short_name"
              name="short_name"
              value={formData.short_name}
              onChange={handleChange}
              placeholder="e.g. AAD"
              required
              disabled={isSubmitting}
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
                "Save ID Proof"
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

      <style jsx>{`
        .blur-background {
          filter: blur(2px);
          transition: filter 0.3s ease;
        }
        
        @media (max-width: 576px) {
          .blur-background {
            filter: blur(1px);
          }
        }
      `}</style>
    </div>
  );
}