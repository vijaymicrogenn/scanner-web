import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faCheck, faTimes, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function ViewCities() {
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/city/view");
      if (Array.isArray(res.data)) setData(res.data);
      else setData([]);
    } catch {
      showToast("Failed to load data", "error");
      setData([]);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleEdit = (id, name) => {
    setEditId(id);
    setEditValue(name);
  };

  const handleCancel = () => {
    setEditId(null);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!editValue.trim()) {
      showToast("City name cannot be empty", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(`/api/city/update/${editId}`, {
        city_name: editValue,
      });
      showToast("City updated successfully....");
      handleCancel();
      fetchData();
    } catch (error) {
      if (error.response?.status === 409) {
        showToast("City name already exists", "error");
      } else {
        showToast("Update failed", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmSoftDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.put(`/api/city/soft-delete/${deleteId}`);
      showToast("City deactivated successfully");
      fetchData();
    } catch {
      showToast("Deactivation failed", "error");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container-fluid px-0">
      <div
        className="table-responsive rounded-3"
        style={{
          background: "rgba(26, 26, 46, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(15px)",
          boxShadow: "0 8px 32px rgba(106, 17, 203, 0.2)",
          minHeight: "calc(100vh - 200px)",
          padding: "20px"
        }}
      >
        <table className="table table-dark table-hover mb-0">
          <thead style={{
            background: "linear-gradient(135deg, rgba(74, 144, 226, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <tr>
              <th style={{ width: "80px", padding: "12px" }} className="text-center">S No</th>
              <th style={{ padding: "12px" }}>City Name</th>
              <th className="text-center" style={{ width: "120px", padding: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-muted py-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  No cities found
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr key={item.city_id} style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <td className="p-1 text-center" style={{ padding: "12px" }}>{i + 1}</td>
                  <td className="p-1" style={{ padding: "12px" }}>{item.city_name}</td>
                  <td className=" p-1 text-center" style={{ padding: "12px" }}>
                    <FontAwesomeIcon
                      icon={faEdit}
                      className="text-warning mx-2"
                      style={{ cursor: "pointer", fontSize: "16px" }}
                      onClick={() => handleEdit(item.city_id, item.city_name)}
                      title="Edit City"
                    />
                    <FontAwesomeIcon
                      icon={faEyeSlash}
                      className="text-danger mx-2"
                      style={{ cursor: "pointer", fontSize: "16px" }}
                      onClick={() => handleSoftDelete(item.city_id)}
                      title="Deactivate City"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editId !== null && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content" style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px"
            }}>
              <div className="modal-header py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <h6 className="modal-title text-white fw-semibold">Edit City</h6>
                <FontAwesomeIcon
                  icon={faTimes}
                  className="text-muted"
                  style={{ cursor: "pointer", fontSize: "18px" }}
                  onClick={handleCancel}
                />
              </div>
              <div className="modal-body py-3">
                <input
                  type="text"
                  className="form-control"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    borderRadius: "6px",
                    padding: "10px 12px"
                  }}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter city name"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
              <div className="modal-footer py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  className="btn btn-primary btn-sm me-2 px-3"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  style={{
                    background: "linear-gradient(135deg, #4a90e2, #9333ea)",
                    border: "none"
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="me-1" />
                      Save
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary btn-sm px-3"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white"
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content" style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px"
            }}>
              <div className="modal-header py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <h6 className="modal-title text-white fw-semibold">Confirm Deactivation</h6>
                <FontAwesomeIcon
                  icon={faTimes}
                  className="text-muted"
                  style={{ cursor: "pointer", fontSize: "18px" }}
                  onClick={cancelDelete}
                />
              </div>
              <div className="modal-body py-3">
                <p className="small m-0 text-light">Deactivate this city? It will be hidden from active lists.</p>
              </div>
              <div className="modal-footer py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  className="btn btn-danger btn-sm me-2 px-3"
                  onClick={confirmSoftDelete}
                  disabled={isSubmitting}
                  style={{
                    background: "linear-gradient(135deg, #dc3545, #c82333)",
                    border: "none"
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faEyeSlash} className="me-1" />
                      Deactivate
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary btn-sm px-3"
                  onClick={cancelDelete}
                  disabled={isSubmitting}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white"
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.message && (
        <div
          className={`position-fixed p-3 rounded-3 shadow ${
            toast.type === "success" 
              ? "bg-success" 
              : "bg-danger"
          }`}
          style={{
            minWidth: "250px",
            zIndex: 9999,
            bottom: "20px",
            right: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div className="text-white fw-medium">{toast.message}</div>
        </div>
      )}
    </div>
  );
}