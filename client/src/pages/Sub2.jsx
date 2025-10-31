import React, { useState } from "react";
import NationalityForm from "./NationalityForm";
import ViewNationality from "./ViewNationality";

export default function Sub2() {
  const [activeSection, setActiveSection] = useState("view");

  return (
    <div>
      <div
        className="d-flex justify-content-between align-items-center mb-4 p-4 rounded-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          className="mb-0 fw-bold"
          style={{
            background: "linear-gradient(45deg, #fff, #4a90e2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Nationality
        </h2>

        <div>
          {/* Add Button */}
          <button
            className="btn fw-medium px-4 py-2 rounded-2 me-2"
            onClick={() => setActiveSection("add")}
            style={{
              background:
                activeSection === "add"
                  ? "linear-gradient(135deg, #4a90e2, #9333ea)" // active
                  : "rgba(255, 255, 255, 0.1)", // inactive
              border:
                activeSection === "add"
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              transition: "all 0.2s ease",
            }}
            
          >
            Add
          </button>

          {/* View Button */}
          <button
            className="btn fw-medium px-4 py-2 rounded-2"
            onClick={() => setActiveSection("view")}
            style={{
              background:
                activeSection === "view"
                  ? "linear-gradient(135deg, #4a90e2, #9333ea)" // active
                  : "rgba(255, 255, 255, 0.1)", // inactive
              border:
                activeSection === "view"
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              transition: "all 0.2s ease",
            }}
           
          >
            View
          </button>
        </div>
      </div>

      {/* Add Section */}
      {activeSection === "add" && (
        <div
          className="p-4 rounded-3"
          style={{
            background: "rgba(26, 26, 46, 0.7)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <NationalityForm
            onClose={() => setActiveSection("view")}
            onSaved={() => setActiveSection("view")}
          />
        </div>
      )}

      {/* View Section */}
      {activeSection === "view" && (
        <div className="p-3 bg-light rounded">
          <ViewNationality />
        </div>
      )}
    </div>
  );
}
