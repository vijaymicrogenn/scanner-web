// Sub3.js - City Page
import React, { useState } from "react";
import CityForm from "./CityForm";
import ViewCities from "./ViewCity";

export default function Sub3() {
  const [activeSection, setActiveSection] = useState("view");

  return (
    <div>
      {/* Header Section */}
      <div 
        className="d-flex justify-content-between align-items-center mb-4 p-4 rounded-3 position-sticky top-0"
        style={{
          background: "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          zIndex:"1000"
        }}
      >
        <div>
          <h2 className="mb-1 fw-bold" style={{ 
            fontSize: "1.8rem",
            background: "linear-gradient(45deg, #fff, #4a90e2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            City  
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
              border: "1px solid rgba(74, 144, 226, 0.3)",
              transition: "all 0.3s ease",
              fontSize: "0.9rem",
              background: activeSection === "add" ? "linear-gradient(135deg, #4a90e2, #9333ea)" : "transparent",
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
              border: "1px solid rgba(74, 144, 226, 0.3)",
              transition: "all 0.3s ease",
              fontSize: "0.9rem",
              background: activeSection === "view" ? "linear-gradient(135deg, #4a90e2, #9333ea)" : "transparent",
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
            background: "rgba(26, 26, 46, 0.7)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            animation: "fadeIn 0.4s ease-out",
            backdropFilter: "blur(10px)"
          }}
        >
         
          <CityForm
            onClose={() => setActiveSection("view")}
            onSaved={() => setActiveSection("view")}
          />
        </div>
      )}

     {activeSection === "view" && (
        <div className="p-3 bg-light rounded">
          <ViewCities />
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .btn-outline-light:hover {
            background: rgba(74, 144, 226, 0.1) !important;
            border-color: rgba(74, 144, 226, 0.5) !important;
            color: #4a90e2 !important;
            transform: translateY(-1px);
          }
        `}
      </style>
    </div>
  );
}