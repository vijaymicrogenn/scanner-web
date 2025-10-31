// Sub1.js - ID Proof Page (Vision Theme)
import React, { useState } from "react";
import ProofFormId from "./ProofFormId";
import ViewProofs from "./ViewProofs";

export default function Sub1() {
  const [activeSection, setActiveSection] = useState("view");

  return (
    <div>
      {/* Header Section */}
      <div 
        className="d-flex justify-content-between align-items-center mb-4 p-4 rounded-3 position-sticky top-0 z-5"
        style={{
          background: "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(42, 42, 90, 0.9) 100%)",
          boxShadow: "0 8px 40px rgba(106, 17, 203, 0.3)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(15px)",
           zIndex: 1000,
        }}
      >
        <div>
          <h2 className="mb-1 fw-bold" style={{ 
            fontSize: "1.8rem",
            background: "linear-gradient(45deg, #FFFFFF, #6A11CB, #2575FC)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            ID Proof 
          </h2>
          
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn fw-medium px-4 py-2 rounded-2 ${
              activeSection === "add" 
                ? "btn-primary" 
                : "btn-outline-light"
            }`}
            onClick={() => setActiveSection("add")}
            style={{
              border: "1px solid rgba(106, 17, 203, 0.4)",
              transition: "all 0.3s ease",
              fontSize: "0.9rem",
              background: activeSection === "add" ? "linear-gradient(135deg, #6A11CB, #2575FC)" : "transparent",
              color: activeSection === "add" ? "white" : "rgba(255,255,255,0.8)"
            }}
          >
           Add
          </button>
          <button
            className={`btn fw-medium px-4 py-2 rounded-2 ${
              activeSection === "view" 
                ? "btn-primary" 
                : "btn-outline-light"
            }`}
            onClick={() => setActiveSection("view")}
            style={{
              border: "1px solid rgba(106, 17, 203, 0.4)",
              transition: "all 0.3s ease",
              fontSize: "0.9rem",
              background: activeSection === "view" ? "linear-gradient(135deg, #6A11CB, #2575FC)" : "transparent",
              color: activeSection === "view" ? "white" : "rgba(255,255,255,0.8)"
            }}
          >
            View 
          </button>
        </div>
      </div>

      {/* Content Section */}
      {activeSection === "add" && (
        <div 
          className="p-4 rounded-3"
          style={{
            background: "rgba(26, 26, 46, 0.8)",
            boxShadow: "0 8px 40px rgba(106, 17, 203, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            animation: "fadeIn 0.4s ease-out",
            backdropFilter: "blur(15px)"
          }}
        >
          
          <ProofFormId
            onClose={() => setActiveSection("view")}
            onSaved={() => setActiveSection("view")}
          />
        </div>
      )}

      {activeSection === "view" && (
        <div className="p-3 bg-light rounded">
          <ViewProofs />
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .btn-outline-light:hover {
            background: rgba(106, 17, 203, 0.1) !important;
            border-color: rgba(106, 17, 203, 0.6) !important;
            color: #6A11CB !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(106, 17, 203, 0.3);
          }
        `}
      </style>
    </div>
  );
}