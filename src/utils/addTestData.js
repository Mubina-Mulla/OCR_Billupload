// Script to add test technician and tickets to Firestore
// Run this in your browser console or create a temporary component

import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const db = getFirestore();

// Add test technician
export const addTestTechnician = async () => {
  try {
    const techniciansRef = collection(db, "mainData", "Billuload", "technicians");
    
    // Check if technician already exists
    const q = query(techniciansRef, where("technicianId", "==", "TECH001"));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      console.log("✅ Technician TECH001 already exists");
      return;
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
    
    console.log("✅ Test technician added successfully!");
    console.log("Login with:");
    console.log("  Technician ID: TECH001");
    console.log("  Password: 12345");
  } catch (error) {
    console.error("❌ Error adding technician:", error);
  }
};

// Add test tickets
export const addTestTickets = async () => {
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
    
    console.log(`✅ ${testTickets.length} test tickets added successfully!`);
  } catch (error) {
    console.error("❌ Error adding tickets:", error);
  }
};

// Add all test data
export const addAllTestData = async () => {
  console.log("🚀 Adding test data to Firestore...");
  await addTestTechnician();
  await addTestTickets();
  console.log("🎉 All test data added successfully!");
};

// Export for use in console
window.addTestTechnician = addTestTechnician;
window.addTestTickets = addTestTickets;
window.addAllTestData = addAllTestData;
