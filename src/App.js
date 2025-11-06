import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase/config';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import ProductManagement from './components/ProductManagement';
import ServiceCenter from './components/ServiceCenter';
import TechManagement from './components/TechManagement/TechManagement';
import Tickets from './components/Tickets';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main Layout Component
const MainLayout = ({ user, handleLogout, stats }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="app">
      <ConnectionStatus />
      <Sidebar 
        currentPath={location.pathname}
        onNavigate={handleNavigation}
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        onClose={closeMobileSidebar}
      />
      <div className={`main-content ${isMobile ? 'mobile' : (sidebarCollapsed ? 'collapsed' : '')}`}>
        <Header 
          user={user} 
          handleLogout={handleLogout} 
          toggleSidebar={toggleSidebar} 
          isMobile={isMobile}
          currentPath={location.pathname}
          onNavigate={handleNavigation}
        />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} />} />
            <Route path="/dashboard" element={<Dashboard stats={stats} />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/customers/:customerId" element={<CustomerManagement />} />
            <Route path="/customers/:customerId/products/:productId" element={<CustomerManagement />} />
            <Route path="/services" element={<ServiceCenter />} />
            <Route path="/services/:serviceId" element={<ServiceCenter />} />
            <Route path="/tech" element={<TechManagement />} />
            <Route path="/tech/:techId" element={<TechManagement />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    services: 0,
    tech: 0,
    tickets: 0,
    pendingTickets: 0,
    completedTickets: 0
  });

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Auth state has been checked
    });

    // Fetch stats data
    const customersRef = ref(database, 'customers');
    onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      setStats(prev => ({ ...prev, customers: data ? Object.keys(data).length : 0 }));
    });

    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      setStats(prev => ({ ...prev, products: data ? Object.keys(data).length : 0 }));
    });

    const servicesRef = ref(database, 'services');
    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      setStats(prev => ({ ...prev, services: data ? Object.keys(data).length : 0 }));
    });

    const techRef = ref(database, 'tech');
    onValue(techRef, (snapshot) => {
      const data = snapshot.val();
      setStats(prev => ({ ...prev, tech: data ? Object.keys(data).length : 0 }));
    });

    const ticketsRef = ref(database, 'tickets');
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tickets = Object.keys(data).length;
        const pending = Object.values(data).filter(ticket => ticket.status === 'pending').length;
        const completed = Object.values(data).filter(ticket => ticket.status === 'completed').length;
        
        setStats(prev => ({ 
          ...prev, 
          tickets,
          pendingTickets: pending,
          completedTickets: completed
        }));
      } else {
        setStats(prev => ({ 
          ...prev, 
          tickets: 0,
          pendingTickets: 0,
          completedTickets: 0
        }));
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUser(null);
    }).catch((error) => {
      console.error('Logout error:', error);
    });
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user}>
              <MainLayout user={user} handleLogout={handleLogout} stats={stats} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
