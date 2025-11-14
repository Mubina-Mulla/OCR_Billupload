import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { getCollectionRef } from './firebase/config';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import ProductManagement from './components/ProductManagement';
import ServiceCenter from './components/ServiceCenter';
import TechManagement from './components/TechManagement/TechManagement';
import TechnicianPortal from './components/TechManagement/TechnicianPortal';
import Tickets from './components/Tickets';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConnectionStatus from './components/ConnectionStatus';
import SuperAdminDashboard from './superadmin/SuperAdminDashboard';
import SetupTestData from './pages/SetupTestData';
import './App.css';

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

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
            {/* Dashboard */}
            <Route path="/" element={<Dashboard stats={stats} />} />
            <Route path="/dashboard" element={<Dashboard stats={stats} />} />
            
            {/* Customer Management */}
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/customers/:customerId" element={<CustomerManagement />} />
            <Route path="/customers/:customerId/products/:productId" element={<CustomerManagement />} />
            
            {/* Service Centers */}
            <Route path="/services" element={<ServiceCenter />} />
            <Route path="/services/:serviceId" element={<ServiceCenter />} />
            
            {/* Technicians */}
            <Route path="/tech" element={<TechManagement />} />
            <Route path="/tech/:techId" element={<TechManagement />} />
            
            {/* Tickets */}
            <Route path="/tickets" element={<Tickets />} />
            
            {/* Fallback */}
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
    const customersRef = getCollectionRef('customers');
    const unsubscribeCustomers = onSnapshot(customersRef, (snapshot) => {
      setStats(prev => ({ ...prev, customers: snapshot.size }));
    });

    const productsRef = getCollectionRef('products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      setStats(prev => ({ ...prev, products: snapshot.size }));
    });

    const servicesRef = getCollectionRef('services');
    const unsubscribeServices = onSnapshot(servicesRef, (snapshot) => {
      setStats(prev => ({ ...prev, services: snapshot.size }));
    });

    const techRef = getCollectionRef('technicians');
    const unsubscribeTech = onSnapshot(techRef, (snapshot) => {
      setStats(prev => ({ ...prev, tech: snapshot.size }));
    });

    const ticketsRef = getCollectionRef('tickets');
    const unsubscribeTickets = onSnapshot(ticketsRef, (snapshot) => {
      const tickets = snapshot.size;
      const pending = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
      const completed = snapshot.docs.filter(doc => doc.data().status === 'completed').length;
      
      setStats(prev => ({ 
        ...prev, 
        tickets,
        pendingTickets: pending,
        completedTickets: completed
      }));
    });

    return () => {
      unsubscribe();
      unsubscribeCustomers();
      unsubscribeProducts();
      unsubscribeServices();
      unsubscribeTech();
      unsubscribeTickets();
    };
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
        <Route path="/login" element={!user ? <Login /> : (() => {
          // Check if user is superadmin
          const superAdmin = localStorage.getItem("superAdmin");
          if (superAdmin) {
            try {
              const adminData = JSON.parse(superAdmin);
              if (adminData.role === "superadmin" && adminData.email.toLowerCase() === "akshay@gmail.com") {
                return <Navigate to="/superadmin" replace />;
              }
            } catch (error) {
              console.error("Error parsing superAdmin data:", error);
            }
          }
          return <Navigate to="/dashboard" replace />;
        })()} />
        <Route path="/technician-portal" element={<TechnicianPortal />} />
        <Route path="/setup-test-data" element={<SetupTestData />} />
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        <Route
          path="/*"
          element={
            user ? (
              <MainLayout user={user} handleLogout={handleLogout} stats={stats} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
