import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase/config";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import "./SuperAdminDashboard.css";

export default function SuperAdminDashboard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [adminEmail, setAdminEmail] = useState("");
  
  const navigate = useNavigate();
  const auth = getAuth();

  // Firestore path: mainData/Billuload/users
  const usersRef = collection(db, "mainData", "Billuload", "users");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(usersRef);
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      console.log('🎯 SuperAdmin: Loading tickets from all users...');
      const usersSnapshot = await getDocs(usersRef);
      const allTickets = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userTicketsRef = collection(db, 'mainData', 'Billuload', 'users', userDoc.id, 'tickets');
        const ticketsSnapshot = await getDocs(userTicketsRef);
        
        ticketsSnapshot.docs.forEach(ticketDoc => {
          allTickets.push({
            id: ticketDoc.id,
            userId: userDoc.id,
            userEmail: userDoc.data().email,
            userName: userDoc.data().name,
            ...ticketDoc.data()
          });
        });
      }
      
      console.log(`🎯 SuperAdmin: Loaded ${allTickets.length} tickets from ${usersSnapshot.docs.length} users`);
      setTickets(allTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  };

  // Calculate points for a technician based on ALL assigned tickets
  const calculateTechnicianPoints = (technicianName) => {
    // Filter ALL tickets for this technician - including Pending, In Progress, Completed, Resolved
    const techTickets = tickets.filter(ticket => {
      const isAssignedToTech = ticket.subOption === technicianName || 
                              ticket.assignedTo === technicianName ||
                              (ticket.subOption && ticket.subOption.toLowerCase().includes(technicianName.toLowerCase())) ||
                              (ticket.assignedTo && ticket.assignedTo.toLowerCase().includes(technicianName.toLowerCase()));
      
      return isAssignedToTech && ticket.createdAt; // Only need start date
    });

    let totalPoints = 0;
    const ticketDetails = [];
    const today = new Date();

    techTickets.forEach(ticket => {
      const startDate = new Date(ticket.createdAt);
      let endDate;
      let daysDiff;

      // Determine end date based on ticket status
      if (ticket.status === "Completed" || ticket.status === "Resolved") {
        // For completed tickets, use actual end date
        endDate = ticket.endDate ? new Date(ticket.endDate) : today;
        const timeDiff = endDate.getTime() - startDate.getTime();
        daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      } else {
        // For pending/in progress tickets, calculate days from start to today
        const timeDiff = today.getTime() - startDate.getTime();
        daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        endDate = today;
      }

      let ticketPoints = 100; // Start with 100 points for each ticket

      if (daysDiff <= 1) {
        // Completed within 24 hours or same day: Full 100 points
        ticketPoints = 100;
      } else {
        // Late completion or ongoing delay: 100 - (10 points * extra days beyond first day)
        const extraDays = daysDiff - 1;
        ticketPoints = Math.max(0, 100 - (extraDays * 10));
      }

      totalPoints += ticketPoints;
      
      // Store details for debugging
      ticketDetails.push({
        ticketNumber: ticket.ticketNumber,
        startDate: startDate.toLocaleDateString(),
        endDate: endDate.toLocaleDateString(),
        daysDiff,
        pointsEarned: ticketPoints,
        status: ticket.status,
        isOngoing: ticket.status !== "Completed" && ticket.status !== "Resolved"
      });
    });

    // Enhanced debug logging
    console.log(`Points calculation for ${technicianName}:`, {
      totalTicketsInSystem: tickets.length,
      assignedTickets: techTickets.length,
      totalPointsEarned: totalPoints,
      maxPossiblePoints: techTickets.length * 100,
      ticketBreakdown: ticketDetails,
      allTicketsForTech: tickets.filter(ticket => {
        const isAssignedToTech = ticket.subOption === technicianName || 
                                ticket.assignedTo === technicianName ||
                                (ticket.subOption && ticket.subOption.toLowerCase().includes(technicianName.toLowerCase())) ||
                                (ticket.assignedTo && ticket.assignedTo.toLowerCase().includes(technicianName.toLowerCase()));
        return isAssignedToTech;
      }).map(t => ({
        ticketNumber: t.ticketNumber,
        status: t.status,
        subOption: t.subOption,
        assignedTo: t.assignedTo,
        hasStartDate: !!t.createdAt,
        hasEndDate: !!t.endDate,
        createdAt: t.createdAt,
        endDate: t.endDate
      }))
    });

    return {
      totalPoints,
      totalTickets: techTickets.length,
      completedTickets: techTickets.filter(t => t.status === "Completed" || t.status === "Resolved").length,
      maxPossiblePoints: techTickets.length * 100
    };
  };

  useEffect(() => {
    // Check if user is logged in
    const superAdmin = localStorage.getItem("superAdmin");
    if (!superAdmin) {
      alert("❌ Please login first");
      navigate("/login");
      return;
    }
    
    try {
      const adminData = JSON.parse(superAdmin);
      
      // Check if the user has superadmin role and correct email
      if (adminData.role !== "superadmin" || adminData.email.toLowerCase() !== "akshay@gmail.com") {
        alert("❌ Access denied. Super Admin access required.");
        localStorage.removeItem("superAdmin");
        navigate("/login");
        return;
      }
      
      setAdminEmail(adminData.email);
    } catch (error) {
      console.error("Error parsing admin data:", error);
      navigate("/login");
      return;
    }
    
    loadUsers();
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'users' || tab === 'addUser') {
      setActiveTab(tab);
    }
  }, []);

  const addUser = async () => {
    if (!name || !email) {
      alert("Name and Email required");
      return;
    }

    setLoading(true);
    try {
      await addDoc(usersRef, { 
        name, 
        email, 
        role, 
        active: true,
        createdAt: new Date().toISOString()
      });
      setName(""); 
      setEmail("");
      setRole("user");
      loadUsers();
      alert("✅ User added successfully!");
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userDoc = doc(db, "mainData", "Billuload", "users", userId);
      await updateDoc(userDoc, { active: !currentStatus });
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user status");
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const userDoc = doc(db, "mainData", "Billuload", "users", userId);
        await deleteDoc(userDoc);
        loadUsers();
        alert("User deleted successfully");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("superAdmin");
      alert("✅ Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("❌ Error logging out");
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="header-icon-box">
            <span className="header-icon">👑</span>
          </div>
          <h2 className="sidebar-title">Super Admin Dashboard</h2>
        </div>
        
        <nav className="sidebar-menu">
          <a 
            href="/superadmin?tab=users"
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={(e) => {
              // Only prevent default on left-click (button 0)
              if (e.button === 0) {
                e.preventDefault();
                setActiveTab('users');
                window.history.pushState({}, '', '/superadmin?tab=users');
              }
            }}
          >
            <span className="item-icon">👥</span>
            <span className="item-label">User Management</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar-header">SA</div>
              <div className="user-details">
                <div className="user-name">{adminEmail || "Super Admin"}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Page Title */}
          <h1 className="content-page-title">
            {activeTab === 'users' ? 'User Management' : 'Add New User'}
          </h1>

          {/* Stats Cards */}
          <div className="stats-section">
            <div className="stat-card-box">
              <div className="stat-card-number">{users.length}</div>
              <div className="stat-card-label">Total Users</div>
            </div>
            <div className="stat-card-box">
              <div className="stat-card-number">{users.filter(u => u.role === 'admin').length}</div>
              <div className="stat-card-label">Admins</div>
            </div>
          </div>
        {activeTab === 'addUser' && (
          <div className="content-card">
            <h2 className="section-title">Add New User</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter user's full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter user's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="form-select"
                >
                  <option value="user">👤 User</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={addUser} 
              disabled={loading || !name || !email}
              className="btn-add"
            >
              {loading ? "Adding..." : "Add User"}
            </button>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="content-card">
            <div className="table-header">
              <h2 className="section-title">User Management</h2>
              <div className="header-actions">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button 
                  onClick={() => {
                    loadTickets();
                    loadUsers();
                  }}
                  className="btn-refresh"
                  style={{ marginRight: '0.5rem' }}
                >
                  🔄 Refresh
                </button>
                <button 
                  onClick={() => setActiveTab('addUser')}
                  className="btn-new-user"
                >
                  ➕ Add User
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={!user.active ? 'inactive-user' : ''}>
                        <td>
                          <div className="user-info">
                            <span className="user-avatar">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                            {user.name}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {(() => {
                            const pointsData = calculateTechnicianPoints(user.name);
                            const avgPoints = pointsData.totalTickets > 0 ? pointsData.totalPoints / pointsData.totalTickets : 0;
                            let performanceClass = 'high-performance';
                            
                            if (avgPoints < 50) {
                              performanceClass = 'low-performance';
                            } else if (avgPoints < 80) {
                              performanceClass = 'medium-performance';
                            }
                            
                            return (
                              <div className="points-info">
                                <span className={`points-total ${performanceClass}`}>
                                  {pointsData.totalPoints}
                                  {pointsData.maxPossiblePoints > 0 && (
                                    <span className="points-max">/{pointsData.maxPossiblePoints}</span>
                                  )}
                                </span>
                                <span className="points-tickets">
                                  ({pointsData.totalTickets} total tickets)
                                </span>
                                {pointsData.totalTickets > 0 && (
                                  <span className="points-average">
                                    {pointsData.completedTickets}/{pointsData.totalTickets} completed | Avg: {Math.round(avgPoints)} pts
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.active)}
                              className={`btn-sm ${user.active ? 'btn-warning' : 'btn-success'}`}
                            >
                              {user.active ? '🔒 Deactivate' : '✅ Activate'}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="btn-sm btn-danger"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="empty-state">
                    <p>No users found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
        }

        .admin-sidebar {
          width: 240px;
          background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
          color: white;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
        }

        .sidebar-header {
          padding: 1.5rem 1.5rem 2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon-box {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header-icon {
          font-size: 1.5rem;
        }

        .sidebar-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .sidebar-menu {
          padding: 0;
          flex: 1;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
          margin: 0.25rem 0;
          text-decoration: none;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
        }

        .menu-item.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-left-color: white;
          font-weight: 600;
        }

        .item-icon {
          font-size: 1.25rem;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-label {
          font-size: 1rem;
          font-weight: 500;
        }

        .admin-main {
          flex: 1;
          margin-left: 240px;
          display: flex;
          flex-direction: column;
        }

        .top-header {
          background: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar-header {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
        }

        .logout-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: #b91c1c;
        }

        .content-area {
          padding: 2rem;
          flex: 1;
        }

        .content-page-title {
          margin: 0 0 1.5rem 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card-box {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-card-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: #4f46e5;
          line-height: 1;
        }

        .stat-card-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.5rem;
        }

        .content-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-top: 0;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 1.5rem 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .form-input, .form-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .btn-add {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-add:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .btn-add:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          width: 300px;
          font-size: 0.9375rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
          font-size: 1rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
        }

        .modern-table th {
          background: #f8fafc;
          padding: 1rem 1.25rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .modern-table td {
          padding: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .modern-table tbody tr {
          transition: background 0.2s ease;
        }

        .modern-table tbody tr:hover {
          background: #f8fafc;
        }

        .inactive-user {
          opacity: 0.6;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #6366f1;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.875rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .role-badge.admin {
          background: #fef3c7;
          color: #92400e;
        }

        .role-badge.user {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-badge {
          display: inline-block;
          padding: 0.375rem 0.875rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-buttons {
          display: flex;
          gap: 0.625rem;
        }

        .btn-sm {
          padding: 0.5rem 1.125rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
        }

        .btn-warning {
          background: #f97316;
          color: white;
        }

        .btn-warning:hover {
          background: #ea580c;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .btn-sm:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .loading, .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            width: 100%;
            height: auto;
            position: relative;
          }

          .sidebar-header {
            padding: 1rem 1rem 1.25rem 1rem;
          }

          .header-icon-box {
            width: 40px;
            height: 40px;
          }

          .header-icon {
            font-size: 1.25rem;
          }

          .sidebar-title {
            font-size: 1rem;
          }

          .sidebar-menu {
            display: flex;
            overflow-x: auto;
            padding: 0;
            -webkit-overflow-scrolling: touch;
          }

          .menu-item {
            flex-shrink: 0;
            border-left: none;
            border-bottom: 3px solid transparent;
            padding: 0.75rem 1rem;
          }

          .menu-item.active {
            border-left: none;
            border-bottom-color: white;
          }

          .admin-main {
            margin-left: 0;
          }

          .top-header {
            padding: 1rem;
            justify-content: flex-end;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .content-page-title {
            font-size: 1.5rem;
          }

          .user-avatar-header {
            width: 36px;
            height: 36px;
            font-size: 0.75rem;
          }

          .user-name {
            font-size: 0.875rem;
          }

          .logout-btn {
            padding: 0.5rem 1rem;
            font-size: 0.8125rem;
          }

          .content-area {
            padding: 1.5rem 1rem;
          }

          .content-page-title {
            font-size: 1.25rem;
            margin-bottom: 1rem;
          }

          .stats-section {
            grid-template-columns: 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .stat-card-box {
            padding: 1.25rem;
          }

          .stat-card-number {
            font-size: 2rem;
          }

          .content-card {
            padding: 1.25rem;
          }

          .section-title {
            font-size: 1.25rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .table-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .search-input {
            width: 100%;
          }

          /* Mobile Table Styles */
          .table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .modern-table {
            font-size: 0.875rem;
          }

          .modern-table th,
          .modern-table td {
            padding: 0.75rem 0.5rem;
            white-space: nowrap;
          }

          .user-info {
            gap: 0.5rem;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }

          .role-badge,
          .status-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.625rem;
          }

          .action-buttons {
            flex-direction: column;
            gap: 0.5rem;
            min-width: 120px;
          }

          .btn-sm {
            padding: 0.5rem 0.75rem;
            font-size: 0.8125rem;
            width: 100%;
          }

          .btn-add {
            width: 100%;
            padding: 0.875rem 1.5rem;
          }
        }

        /* Extra small devices */
        @media (max-width: 480px) {
          .sidebar-header {
            padding: 0.875rem 0.875rem 1rem 0.875rem;
          }

          .header-icon-box {
            width: 36px;
            height: 36px;
          }

          .header-icon {
            font-size: 1.125rem;
          }

          .sidebar-title {
            font-size: 0.9375rem;
          }

          .item-label {
            font-size: 0.875rem;
          }

          .content-area {
            padding: 1rem 0.75rem;
          }

          .content-page-title {
            font-size: 1.125rem;
            margin-bottom: 0.875rem;
          }

          .stats-section {
            margin-bottom: 1rem;
          }

          .stat-card-number {
            font-size: 1.75rem;
          }

          .stat-card-label {
            font-size: 0.8125rem;
          }

          .content-card {
            padding: 1rem;
          }

          .section-title {
            font-size: 1.125rem;
          }

          .modern-table {
            font-size: 0.8125rem;
          }

          .modern-table th,
          .modern-table td {
            padding: 0.625rem 0.375rem;
          }
        }
      `}</style>
    </div>
  );
}