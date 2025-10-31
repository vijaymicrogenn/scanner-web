 

function Dashboard() {
  return (
    <></>
  );
}

export default Dashboard;


import { useState, useEffect } from "react";
// import axios from "axios";
// import { 
//   FaUsers, 
//   FaCity, 
//   FaFlag, 
//   FaIdCard, 
//   FaUserPlus, 
//   FaChartLine,
//   FaCalendarAlt,
//   FaBell,
//   FaSearch
// } from "react-icons/fa";

// function Dashboard() {
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     totalCities: 0,
//     totalNations: 0,
//     totalIDs: 0
//   });

//   const [recentActivities, setRecentActivities] = useState([]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       // ✅ Fetch statistics
//       const statsRes = await axios.get("http://localhost:5000/api/dashboard/stats");
//       setStats(statsRes.data);

//       // ✅ Fetch recent activities
//       const activityRes = await axios.get("http://localhost:5000/api/dashboard/recent-activities");
//       setRecentActivities(activityRes.data);
//     } catch (error) {
//       console.error("Error loading dashboard data:", error);
//     }
//   };

//   // ---- Stat Card ----
//   const StatCard = ({ title, value, icon, color }) => (
//     <div 
//       className={`card border-0 shadow-sm text-white`}
//       style={{ 
//         background: color,
//         transition: 'transform 0.2s ease-in-out'
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.transform = 'translateY(-5px)';
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.transform = 'translateY(0)';
//       }}
//     >
//       <div className="card-body">
//         <div className="d-flex justify-content-between align-items-center">
//           <div>
//             <h6 className="card-title mb-1 opacity-75">{title}</h6>
//             <h3 className="mb-0 fw-bold">{value?.toLocaleString?.() || 0}</h3>
//           </div>
//           <div className="display-6 opacity-75">
//             {icon}
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   // ---- Recent Activity ----
//   const ActivityItem = ({ activity }) => {
//     const getIcon = (type) => {
//       switch (type) {
//         case 'user': return <FaUsers className="text-primary" />;
//         case 'city': return <FaCity className="text-success" />;
//         case 'nation': return <FaFlag className="text-warning" />;
//         case 'id': return <FaIdCard className="text-info" />;
//         default: return <FaBell className="text-secondary" />;
//       }
//     };

//     return (
//       <div className="d-flex align-items-center py-2 border-bottom">
//         <div className="flex-shrink-0 me-3">
//           {getIcon(activity.type)}
//         </div>
//         <div className="flex-grow-1">
//           <p className="mb-0 small">{activity.action}</p>
//           <small className="text-muted">{activity.time}</small>
//         </div>
//       </div>
//     );
//   };

//   // ---- Quick Action ----
//   const QuickAction = ({ title, description, icon, color }) => (
//     <div 
//       className="card border-0 shadow-sm h-100"
//       style={{ 
//         transition: 'all 0.3s ease',
//         cursor: 'pointer'
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.transform = 'translateY(-3px)';
//         e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.transform = 'translateY(0)';
//         e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
//       }}
//     >
//       <div className="card-body text-center">
//         <div 
//           className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
//           style={{
//             width: '60px',
//             height: '60px',
//             background: color,
//             color: 'white'
//           }}
//         >
//           {icon}
//         </div>
//         <h6 className="card-title mb-2">{title}</h6>
//         <p className="card-text small text-muted mb-0">{description}</p>
//       </div>
//     </div>
//   );

//   return (
//     <div className="container-fluid py-3">
//       {/* Header */}
//       <div className="row mb-4">
//         <div className="col-12">
//           <div className="d-flex justify-content-between align-items-center">
//             <div>
//               <h4 className="fw-bold text-dark mb-1">Dashboard Overview</h4>
//               <p className="text-muted mb-0">Welcome back! Here's what's happening today.</p>
//             </div>
//             <div className="d-flex gap-2">
//               <div className="input-group input-group-sm" style={{ width: '250px' }}>
//                 <span className="input-group-text bg-light border-end-0">
//                   <FaSearch className="text-muted" />
//                 </span>
//                 <input 
//                   type="text" 
//                   className="form-control border-start-0" 
//                   placeholder="Search..." 
//                 />
//               </div>
//               <button className="btn btn-light btn-sm position-relative">
//                 <FaBell />
//                 <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
//                   3
//                 </span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="row mb-4">
//         <div className="col-xl-3 col-md-6 mb-3">
//           <StatCard 
//             title="Total Users" 
//             value={stats.totalUsers} 
//             icon={<FaUsers />}
//             color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
//           />
//         </div>
//         <div className="col-xl-3 col-md-6 mb-3">
//           <StatCard 
//             title="Cities" 
//             value={stats.totalCities} 
//             icon={<FaCity />}
//             color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
//           />
//         </div>
//         <div className="col-xl-3 col-md-6 mb-3">
//           <StatCard 
//             title="Nationalities" 
//             value={stats.totalNations} 
//             icon={<FaFlag />}
//             color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
//           />
//         </div>
//         <div className="col-xl-3 col-md-6 mb-3">
//           <StatCard 
//             title="ID Records" 
//             value={stats.totalIDs} 
//             icon={<FaIdCard />}
//             color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
//           />
//         </div>
//       </div>

//       <div className="row">
//         {/* Quick Actions */}
//         <div className="col-lg-8 mb-4">
//           <div className="card border-0 shadow-sm">
//             <div className="card-header bg-white border-0 py-3">
//               <h6 className="mb-0 fw-bold">
//                 <FaChartLine className="me-2 text-primary" />
//                 Quick Actions
//               </h6>
//             </div>
//             <div className="card-body">
//               <div className="row g-3">
//                 <div className="col-md-6">
//                   <QuickAction 
//                     title="Manage Users"
//                     description="View and manage all user accounts"
//                     icon={<FaUsers size={24} />}
//                     color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
//                   />
//                 </div>
//                 <div className="col-md-6">
//                   <QuickAction 
//                     title="Add New User"
//                     description="Register a new user account"
//                     icon={<FaUserPlus size={24} />}
//                     color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
//                   />
//                 </div>
//                 <div className="col-md-6">
//                   <QuickAction 
//                     title="City Management"
//                     description="Manage cities and locations"
//                     icon={<FaCity size={24} />}
//                     color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
//                   />
//                 </div>
//                 <div className="col-md-6">
//                   <QuickAction 
//                     title="Nationalities"
//                     description="Handle nationality data"
//                     icon={<FaFlag size={24} />}
//                     color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Recent Activity */}
//         <div className="col-lg-4 mb-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-header bg-white border-0 py-3">
//               <h6 className="mb-0 fw-bold">
//                 <FaCalendarAlt className="me-2 text-warning" />
//                 Recent Activity
//               </h6>
//             </div>
//             <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
//               {recentActivities.length > 0 ? (
//                 recentActivities.map(activity => (
//                   <ActivityItem key={activity.id} activity={activity} />
//                 ))
//               ) : (
//                 <p className="text-muted small">No recent activities found.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Charts Section */}
//       <div className="row mb-4">
//         <div className="col-12">
//           <div className="card border-0 shadow-sm">
//             <div className="card-header bg-white border-0 py-3">
//               <h6 className="mb-0 fw-bold">System Overview</h6>
//             </div>
//             <div className="card-body">
//               <div className="text-center py-5">
//                 <FaChartLine size={48} className="text-muted mb-3" />
//                 <h6 className="text-muted">Analytics charts will be displayed here</h6>
//                 <p className="text-muted small mb-0">User growth, registration trends, and system metrics</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;
