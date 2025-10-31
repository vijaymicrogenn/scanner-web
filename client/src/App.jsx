import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Sub1 from "./pages/Sub1";
import Sub2 from "./pages/Sub2";
import Sub3 from "./pages/Sub3";
import ProofFormId from "./pages/ProofFormId";
import NationalityForm from "./pages/NationalityForm";
import CityForm from "./pages/CityForm";
import ViewProofs from "./pages/ViewProofs";
import ViewCities from "./pages/ViewCity";
import ViewNationality from "./pages/ViewNationality";
import UserForm from "./pages/mobile-scanner/UserForm";
import UserList from "./pages/mobile-scanner/UserList"; 
import "./app.css";
import Login from "./pages/login";
import ScrollToTop from "./pages/ScrollToTop";
import QRCodeManager from "./pages/mobile-scanner/QRCodeManager";

// ---------------- Protected Route using sessionStorage ----------------
function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      {/* <ScrollToTop /> */}
      <Routes>
        {/* Public routes (no login required) */}
        <Route path="/login" element={<Login />} />
        <Route path="/userform" element={<UserForm />} /> {/* Fixed: lowercase and accessible without login */}
        
        {/* Protected routes (require login) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="d-flex vh-100">
                <Sidebar />
                <div className="flex-grow-1 ">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sub1" element={<Sub1 />} />
                    <Route path="/sub2" element={<Sub2 />} />
                    <Route path="/sub3" element={<Sub3 />} />
                    <Route path="/ProofFormId" element={<ProofFormId />} />
                    <Route path="/NationalityForm" element={<NationalityForm />} />
                    <Route path="/CityForm" element={<CityForm />} />
                    <Route path="/ViewProofs" element={<ViewProofs />} />
                    <Route path="/ViewCities" element={<ViewCities />} />
                    <Route path="/ViewNationality" element={<ViewNationality />} />
                    <Route path="/UserList" element={<UserList />} />
                    <Route path="/QRCodeManager" element={<QRCodeManager />} />
                    
                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}