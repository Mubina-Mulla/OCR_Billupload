import { useState } from 'react';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export default function SetupTestData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const db = getFirestore();

  const addTestTechnician = async () => {
    try {
      const techniciansRef = collection(db, "mainData", "Billuload", "technicians");
      
      // Check if technician already exists
      const q = query(techniciansRef, where("technicianId", "==", "TECH001"));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        return "Technician TECH001 already exists";
      }
      
      // Add new technician
      await addDoc(techniciansRef, {
        technicianId: "TECH001",
        name: "Rahul Deshmukh",
        password: "12345",
        role: "technician",
        email: "rahul@example.com",
        phone: "+91-9876543210",
        createdAt: new Date().toISOString()
      });
      
      return "✅ Technician added successfully!";
    } catch (error) {
      console.error("Error adding technician:", error);
      return "❌ Error: " + error.message;
    }
  };

  const addTestTickets = async () => {
    try {
      const ticketsRef = collection(db, "mainData", "Billuload", "tickets");
      
      const testTickets = [
        {
          title: "AC Not Cooling",
          customer: "Sameer Khan",
          technicianId: "TECH001",
          status: "pending",
          description: "Air conditioner is running but not cooling the room properly",
          serviceType: "ATM (In Store)",
          priority: "high",
          createdAt: new Date().toISOString(),
          address: "123 MG Road, Pune",
          contactNumber: "+91-9876543210"
        },
        {
          title: "Refrigerator Making Noise",
          customer: "Anjali Desai",
          technicianId: "TECH001",
          status: "in-progress",
          description: "Refrigerator compressor making loud noise",
          serviceType: "ATM (Third Party)",
          priority: "medium",
          createdAt: new Date().toISOString(),
          address: "456 FC Road, Pune",
          contactNumber: "+91-9876543211"
        },
        {
          title: "Washing Machine Repair",
          customer: "Rajesh Patil",
          technicianId: "TECH001",
          status: "completed",
          description: "Washing machine not draining water",
          serviceType: "ATM (In Store)",
          priority: "low",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          address: "789 Shivaji Nagar, Pune",
          contactNumber: "+91-9876543212"
        },
        {
          title: "Microwave Not Heating",
          customer: "Sneha Joshi",
          technicianId: "TECH001",
          status: "pending",
          description: "Microwave turns on but doesn't heat food",
          serviceType: "ATM (In Store)",
          priority: "medium",
          createdAt: new Date().toISOString(),
          address: "321 Kothrud, Pune",
          contactNumber: "+91-9876543213"
        }
      ];
      
      for (const ticket of testTickets) {
        await addDoc(ticketsRef, ticket);
      }
      
      return `✅ ${testTickets.length} tickets added successfully!`;
    } catch (error) {
      console.error("Error adding tickets:", error);
      return "❌ Error: " + error.message;
    }
  };

  const handleAddAllData = async () => {
    setLoading(true);
    setMessage('Adding test data...');
    
    try {
      const techResult = await addTestTechnician();
      const ticketResult = await addTestTickets();
      
      setMessage(`
        ${techResult}
        ${ticketResult}
        
        🎉 Setup Complete!
        
        You can now login with:
        Technician ID: TECH001
        Password: 12345
      `);
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔧 Test Data Setup</h1>
        <p style={styles.description}>
          Click the button below to add test technician and tickets to Firestore
        </p>
        
        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>What will be added:</h3>
          <ul style={styles.list}>
            <li><strong>1 Technician:</strong> TECH001 (Rahul Deshmukh)</li>
            <li><strong>4 Tickets:</strong> Assigned to TECH001</li>
            <li>Password: <code style={styles.code}>12345</code></li>
          </ul>
        </div>
        
        <button 
          onClick={handleAddAllData}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Adding Data...' : 'Add Test Data to Firestore'}
        </button>
        
        {message && (
          <div style={styles.messageBox}>
            <pre style={styles.message}>{message}</pre>
          </div>
        )}
        
        <div style={styles.linkBox}>
          <a href="/technician/login" style={styles.link}>
            → Go to Technician Login
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '600px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    padding: '40px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center'
  },
  description: {
    margin: '0 0 24px 0',
    fontSize: '1rem',
    color: '#64748b',
    textAlign: 'center'
  },
  infoBox: {
    background: '#f8fafc',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  infoTitle: {
    margin: '0 0 12px 0',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  list: {
    margin: 0,
    paddingLeft: '20px',
    color: '#475569',
    lineHeight: 1.8
  },
  code: {
    background: '#e5e7eb',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9em'
  },
  button: {
    width: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '8px',
    fontSize: '1.0625rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
  },
  messageBox: {
    marginTop: '24px',
    background: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '8px',
    padding: '16px'
  },
  message: {
    margin: 0,
    fontSize: '0.9375rem',
    color: '#166534',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6
  },
  linkBox: {
    marginTop: '24px',
    textAlign: 'center'
  },
  link: {
    color: '#667eea',
    fontSize: '1rem',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s ease'
  }
};
