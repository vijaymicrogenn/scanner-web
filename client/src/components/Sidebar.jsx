// DashboardLayout.js - Vision Theme
import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FaIdCard, FaFlag, FaCity, FaUsers, FaUserPlus, FaChevronDown, FaChevronUp, FaEye, FaUser ,FaQrcode } from "react-icons/fa";

export default function DashboardLayout() {
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownHeight, setDropdownHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeHover, setActiveHover] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (sidebarDropdownOpen && dropdownRef.current) {
      setDropdownHeight(dropdownRef.current.scrollHeight);
    } else {
      setDropdownHeight(0);
    }
  }, [sidebarDropdownOpen]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { to: "/sub1", icon: FaIdCard, label: "ID Proof", mobileLabel: "ID" },
    { to: "/sub2", icon: FaFlag, label: "Nationality", mobileLabel: "Nation" },
    { to: "/sub3", icon: FaCity, label: "City", mobileLabel: "City" },
    { to: "/UserList", icon: FaUsers, label: "Userlist", mobileLabel: "Users" },
    // { to: "/UserForm", icon: FaUserPlus, label: "Guest Registration", mobileLabel: "Register" },
    { to: "/QRCodeManager", icon: FaQrcode , label: "QRCode", mobileLabel: "Users" },
    // { to: "/client", icon: FaQrcode , label: "client  Registration", mobileLabel: "client" },
  ];

  return (
    <div className="min-vh-100 d-flex vision-theme">
      {/* 📱 Mobile Sidebar */}
      <aside
        className="text-white d-md-none d-flex flex-column align-items-center py-3 position-fixed sidebar-mobile"
        style={{
          width: "80px",
          flexShrink: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 1100,
          background: "linear-gradient(180deg, #0A0A1A 0%, #1A1A3E 50%, #2D2B55 100%)",
          boxShadow: "8px 0 40px rgba(106, 17, 203, 0.3)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div 
          className="mb-4 mt-2 logo-container"
          style={{ 
            fontSize: "1.8rem",
            background: "linear-gradient(135deg, rgba(106, 17, 203, 0.3) 0%, rgba(37, 117, 252, 0.3) 100%)",
            borderRadius: "16px",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(106, 17, 203, 0.4)"
          }}
        >
          <FaUser />
        </div>
        <nav className="d-flex flex-column gap-3 w-100 align-items-center">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-decoration-none d-flex flex-column align-items-center nav-item-mobile ${
                  isActive ? "active-mobile" : ""
                }`
              }
              style={{ fontSize: "0.7rem" }}
              onMouseEnter={() => setActiveHover(item.to)}
              onMouseLeave={() => setActiveHover(null)}
            >
              <div 
                className="icon-container position-relative"
                style={{
                  transform: activeHover === item.to ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div 
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: location.pathname === item.to 
                      ? "linear-gradient(135deg, rgba(106, 17, 203, 0.4) 0%, rgba(37, 117, 252, 0.4) 100%)" 
                      : activeHover === item.to 
                        ? "rgba(255,255,255,0.08)" 
                        : "transparent",
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(15px)",
                    border: location.pathname === item.to 
                      ? "1px solid rgba(106, 17, 203, 0.6)" 
                      : "1px solid transparent"
                  }}
                >
                  <item.icon 
                    size={18} 
                    style={{
                      color: location.pathname === item.to ? "#c5b8d3ff" : "rgba(255,255,255,0.7)",
                      filter: activeHover === item.to ? "drop-shadow(0 0 8px rgba(106, 17, 203, 0.8))" : "none",
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
                {location.pathname === item.to && (
                  <div 
                    className="position-absolute top-0 start-100 translate-middle-x"
                  >
                    <div 
                      className="rounded-pill pulse-animation"
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: "#6A11CB",
                        boxShadow: "0 0 12px #6A11CB"
                      }}
                    />
                  </div>
                )}
              </div>
              <span 
                className="mt-2 label-text"
                style={{
                  color: location.pathname === item.to ? "#6A11CB" : "rgba(255,255,255,0.7)",
                  fontWeight: location.pathname === item.to ? "600" : "400",
                  transform: activeHover === item.to ? "translateY(-1px)" : "translateY(0)",
                  transition: "all 0.2s ease",
                  fontSize: "0.7rem",
                  letterSpacing: "0.2px"
                }}
              >
                {item.mobileLabel}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 💻 Desktop Sidebar */}
      <aside
        className="text-white p-4 d-none d-md-block position-fixed sidebar-desktop"
        style={{ 
          width: "280px", 
          height: "100vh", 
          overflowY: "auto",
          background: "linear-gradient(180deg, #0A0A1A 0%, #1A1A3E 50%, #2D2B55 100%)",
          boxShadow: "12px 0 50px rgba(106, 17, 203, 0.4)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 1000,
        }}
      >
        <div className="sidebar-header mb-6 mt-2 text-center">
          <div 
            className="logo-desktop mx-auto mb-4"
            style={{
              fontSize: "2.2rem",
              background: "linear-gradient(135deg, rgba(106, 17, 203, 0.3) 0%, rgba(37, 117, 252, 0.3) 100%)",
              borderRadius: "20px",
              width: "70px",
              height: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 12px 40px rgba(106, 17, 203, 0.5)"
            }}
          >
            <FaUser />
          </div>
          <h5 
            className="text-white fw-bold mb-2"
            style={{
              textShadow: "0 2px 20px rgba(106, 17, 203, 0.8)",
              letterSpacing: "0.5px",
              fontSize: "1.4rem",
              background: "linear-gradient(45deg, #FFFFFF, #6A11CB, #2575FC)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
             Dashboard
          </h5>
          
        </div>
        
        <ul className="nav flex-column gap-1">
          {navItems.map((item) => (
            <li key={item.to} className="nav-item-desktop">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link-desktop d-block py-3 px-3 text-decoration-none rounded-2 ${
                    isActive ? "active-desktop" : "text-light hover-desktop"
                  }`
                }
                style={{
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: "1px solid transparent",
                  margin: "2px 0"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(6px)";
                  setActiveHover(item.to);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  setActiveHover(null);
                }}
              >
                <div className="d-flex align-items-center">
                  <div 
                    className="rounded-2 d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "30px",
                      height: "30px",
                      background: location.pathname === item.to 
                        ? "linear-gradient(135deg, rgba(106, 17, 203, 0.3) 0%, rgba(37, 117, 252, 0.3) 100%)" 
                        : "rgba(255,255,255,0.05)",
                      transition: "all 0.3s ease",
                      backdropFilter: "blur(15px)",
                      border: location.pathname === item.to 
                        ? "1px solid rgba(106, 17, 203, 0.4)" 
                        : "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <item.icon 
                      size={16}
                      style={{
                        color: location.pathname === item.to ? "#ded1ebff" : "rgba(255,255,255,0.8)",
                        transform: activeHover === item.to ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.3s ease",
                      }}
                    />
                  </div>
                  <span 
                    className="fw-medium"
                    style={{
                      fontSize: "0.95rem",
                      letterSpacing: "0.2px",
                      color: location.pathname === item.to ? "#fff" : "rgba(255,255,255,0.9)"
                    }}
                  >
                    {item.label}
                  </span>
                  {location.pathname === item.to && (
                    <div 
                      className="ms-auto"
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6A11CB, #2575FC)",
                        boxShadow: "0 0 15px #6A11CB",
                        animation: "pulse 2s infinite",
                      }}
                    />
                  )}
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
        
        
      </aside>

      {/* 🧱 Main Content */}
      <main
        className="flex-grow-1 main-content"
        style={{
          marginLeft: isMobile ? "80px" : "280px",
          width: isMobile ? "calc(100% - 80px)" : "calc(100% - 280px)",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0A0A1A 0%, #1A1A3E 100%)",
          transition: "margin-left 0.3s ease, width 0.3s ease",
        }}
      >
        <div 
          className=""
        >
          <Outlet
            context={{ mode: isMobile ? "mobile" : "desktop" }}
            key={location.pathname}
          />
        </div>
      </main>

      {/* Vision Theme CSS */}
        <style>
          {`
            .vision-theme {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes pulse {
              0% { 
                opacity: 1; 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(106, 17, 203, 0.7);
              }
              50% { 
                opacity: 0.8; 
                transform: scale(1.1); 
                box-shadow: 0 0 0 10px rgba(106, 17, 203, 0);
              }
              100% { 
                opacity: 1; 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(106, 17, 203, 0);
              }
            }
            
            @keyframes slideIn {
              from { transform: translateX(-20px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes subtleGlow {
              0% { box-shadow: 0 0 20px rgba(106, 17, 203, 0.3); }
              50% { box-shadow: 0 0 30px rgba(106, 17, 203, 0.5); }
              100% { box-shadow: 0 0 20px rgba(106, 17, 203, 0.3); }
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-5px); }
            }
            
            .nav-link-desktop {
              position: relative;
              overflow: hidden;
              backdrop-filter: blur(15px);
            }
            
            .nav-link-desktop::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              height: 100%;
              width: 3px;
              background: linear-gradient(180deg, #6A11CB, #2575FC);
              transform: scaleY(0);
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              border-radius: 0 4px 4px 0;
            }
            
            .nav-link-desktop:hover::before,
            .active-desktop::before {
              transform: scaleY(1);
            }
            
            .active-desktop {
              background: rgba(255, 255, 255, 0.08) !important;
              border-color: rgba(106, 17, 203, 0.4) !important;
              box-shadow: 
                0 4px 25px rgba(106, 17, 203, 0.3),
                inset 0 1px 0 rgba(255,255,255,0.1) !important;
              backdrop-filter: blur(20px);
              animation: subtleGlow 3s infinite;
            }
            
            .hover-desktop:hover {
              background: rgba(255, 255, 255, 0.05) !important;
              border-color: rgba(255, 255, 255, 0.1) !important;
            }
            
            .active-mobile {
              color: #6A11CB !important;
            }
            
            .nav-item-mobile {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              border-radius: 10px;
              padding: 6px 4px;
            }
            
            .nav-item-mobile:hover {
              transform: translateY(-2px);
              background: rgba(255,255,255,0.05);
            }
            
            .pulse-animation {
              animation: pulse 2s infinite;
            }
            
            .sidebar-mobile {
              animation: slideIn 0.4s ease-out;
            }
            
            .sidebar-desktop {
              animation: slideIn 0.5s ease-out;
            }
            
            .content-wrapper {
              animation: fadeIn 0.6s ease-out;
            }
            
            /* Custom scrollbar */
            .sidebar-desktop::-webkit-scrollbar {
              width: 5px;
            }
            
            .sidebar-desktop::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.05);
              border-radius: 8px;
            }
            
            .sidebar-desktop::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #6A11CB, #2575FC);
              border-radius: 8px;
            }
            
            .sidebar-desktop::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #2575FC, #6A11CB);
            }
            
            /* Text rendering improvements */
            .sidebar-desktop * {
              text-rendering: optimizeLegibility;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            /* Selection color */
            ::selection {
              background: rgba(106, 17, 203, 0.3);
              color: white;
            }
            
            /* Floating animation for logo */
            .logo-desktop {
              animation: float 6s ease-in-out infinite;
            }
          `}
        </style>
    </div>
  );
}