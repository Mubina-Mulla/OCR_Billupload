import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentPath, onNavigate, collapsed, isMobile, onClose }) => {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/services', label: 'Service', icon: '🔧' },
    { path: '/tech', label: 'Technician', icon: '👨‍💻' },
    { path: '/tickets', label: 'Tickets', icon: '🎫' }
  ];

  const handleItemClick = (e, path) => {
    // Only prevent default on left-click (button 0)
    if (e.button === 0) {
      e.preventDefault();
      onNavigate(path);
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  return (
    <>
      {isMobile && !collapsed && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-header">
          <h2>{collapsed ? 'AP' : 'Admin Panel'}</h2>
          {isMobile && !collapsed && (
            <button className="close-sidebar" onClick={onClose}>×</button>
          )}
        </div>
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li key={item.path}>
              <a
                href={item.path}
                className={currentPath === item.path ? 'active' : ''}
                onClick={(e) => handleItemClick(e, item.path)}
                title={collapsed ? item.label : ''}
              >
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="label">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;