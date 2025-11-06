// src/components/Header.js
import React, { useState, useEffect } from "react";
import "./Header.css";

const Header = ({ user, handleLogout, toggleSidebar, currentPath, onNavigate }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/services', label: 'Services', icon: '🔧' },
    { path: '/tech', label: 'Tech', icon: '👨‍💻' },
    { path: '/tickets', label: 'Tickets', icon: '🎫' }
  ];

  const getPageTitle = () => {
    const currentNav = navItems.find(item => item.path === currentPath);
    return currentNav ? currentNav.label : "Admin Panel";
  };

  const getUserInitial = (email) => (email ? email.charAt(0).toUpperCase() : "A");

  // Handle responsive resizing
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogoutClick = () => {
    if (window.confirm("Are you sure you want to logout?")) handleLogout();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <h1 className="header-title">{getPageTitle()}</h1>
      </div>


      <div className="header-right">
        {!isMobile && (
          <div
            className="user-section"
            onClick={() => setShowUserMenu((prev) => !prev)}
          >
            <div className="user-avatar">{getUserInitial(user.email)}</div>
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <span className="user-email">{user.email}</span>
            </div>
            <div className={`dropdown ${showUserMenu ? "open" : ""}`}>▼</div>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-item">Profile</div>
                <div className="dropdown-item">Settings</div>
                <div className="dropdown-divider"></div>
                <div
                  className="dropdown-item logout"
                  onClick={handleLogoutClick}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        )}

        {/* Always visible logout button on all screens */}
        <button className="logout-btn" onClick={handleLogoutClick}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
