# Firestore Test Data Setup

## 🎯 Quick Setup Guide

Follow these steps to add test data to your Firestore database.

---

## 📍 Step 1: Add Test Technician

### Path in Firestore Console:
```
mainData → Billuload → technicians → [Add Document]
```

### Document Data:
```javascript
{
  "technicianId": "TECH001",
  "name": "Rahul Deshmukh",
  "password": "12345",
  "role": "technician",
  "email": "rahul@example.com",
  "phone": "+91-9876543210"
}
```

### Additional Test Technicians:
```javascript
// Technician 2
{
  "technicianId": "TECH002",
  "name": "Priya Sharma",
  "password": "test123",
  "role": "technician",
  "email": "priya@example.com",
  "phone": "+91-9876543211"
}

// Technician 3
{
  "technicianId": "TECH003",
  "name": "Amit Kumar",
  "password": "amit@123",
  "role": "technician",
  "email": "amit@example.com",
  "phone": "+91-9876543212"
}
```

---

## 🎫 Step 2: Add Test Tickets

### Path in Firestore Console:
```
mainData → Billuload → tickets → [Add Document]
```

### Sample Tickets for TECH001:

#### Ticket 1 - Pending
```javascript
{
  "title": "AC Not Cooling",
  "customer": "Sameer Khan",
  "technicianId": "TECH001",
  "status": "pending",
  "description": "Air conditioner is running but not cooling the room properly",
  "serviceType": "ATM (In Store)",
  "priority": "high",
  "createdAt": "2024-01-20T10:30:00Z",
  "address": "123 MG Road, Pune",
  "contactNumber": "+91-9876543210"
}
```

#### Ticket 2 - In Progress
```javascript
{
  "title": "Refrigerator Making Noise",
  "customer": "Anjali Desai",
  "technicianId": "TECH001",
  "status": "in-progress",
  "description": "Refrigerator compressor making loud noise",
  "serviceType": "ATM (Third Party)",
  "priority": "medium",
  "createdAt": "2024-01-19T14:15:00Z",
  "address": "456 FC Road, Pune",
  "contactNumber": "+91-9876543211"
}
```

#### Ticket 3 - Completed
```javascript
{
  "title": "Washing Machine Repair",
  "customer": "Rajesh Patil",
  "technicianId": "TECH001",
  "status": "completed",
  "description": "Washing machine not draining water",
  "serviceType": "ATM (In Store)",
  "priority": "low",
  "createdAt": "2024-01-18T09:00:00Z",
  "completedAt": "2024-01-18T16:30:00Z",
  "address": "789 Shivaji Nagar, Pune",
  "contactNumber": "+91-9876543212"
}
```

#### Ticket 4 - Pending
```javascript
{
  "title": "Microwave Not Heating",
  "customer": "Sneha Joshi",
  "technicianId": "TECH001",
  "status": "pending",
  "description": "Microwave turns on but doesn't heat food",
  "serviceType": "ATM (In Store)",
  "priority": "medium",
  "createdAt": "2024-01-21T11:45:00Z",
  "address": "321 Kothrud, Pune",
  "contactNumber": "+91-9876543213"
}
```

### Sample Tickets for TECH002:

```javascript
// Ticket for different technician (won't show for TECH001)
{
  "title": "TV Screen Flickering",
  "customer": "Vikram Singh",
  "technicianId": "TECH002",
  "status": "pending",
  "description": "TV screen flickers intermittently",
  "serviceType": "ATM (Third Party)",
  "priority": "high",
  "createdAt": "2024-01-20T13:20:00Z",
  "address": "555 Baner, Pune",
  "contactNumber": "+91-9876543214"
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Successful Login
1. Go to: `http://localhost:3000/technician/login`
2. Enter:
   - **Technician ID:** TECH001
   - **Password:** 12345
3. Expected: Redirect to dashboard with 4 tickets visible

### Scenario 2: Wrong Password
1. Go to: `http://localhost:3000/technician/login`
2. Enter:
   - **Technician ID:** TECH001
   - **Password:** wrongpass
3. Expected: Error message "❌ Wrong Password"

### Scenario 3: Invalid Technician ID
1. Go to: `http://localhost:3000/technician/login`
2. Enter:
   - **Technician ID:** TECH999
   - **Password:** 12345
3. Expected: Error message "❌ Invalid Technician ID"

### Scenario 4: Ticket Filtering
1. Login as TECH001
2. Expected: See 4 tickets (AC, Refrigerator, Washing Machine, Microwave)
3. Should NOT see: TV ticket (assigned to TECH002)

### Scenario 5: Empty State
1. Login as TECH003 (no tickets assigned)
2. Expected: See empty state message "No tickets assigned"

---

## 📊 Expected Dashboard Stats (for TECH001)

After adding the sample data:
- **Total Tickets:** 4
- **Pending:** 2 (AC, Microwave)
- **In Progress:** 1 (Refrigerator)
- **Completed:** 1 (Washing Machine)

---

## 🔍 Verification Checklist

- [ ] Technician document exists in `mainData/Billuload/technicians`
- [ ] Technician has `technicianId` field
- [ ] Technician has `password` field
- [ ] Tickets exist in `mainData/Billuload/tickets`
- [ ] Tickets have `technicianId` field matching technician
- [ ] Tickets have `status` field
- [ ] Can login successfully
- [ ] Dashboard shows correct tickets
- [ ] Stats cards show correct counts
- [ ] Can logout successfully

---

## 🚀 Quick Firebase Console Commands

If you prefer using Firebase CLI or scripts:

```javascript
// Add technician using Firebase Admin SDK
const admin = require('firebase-admin');
const db = admin.firestore();

await db.collection('mainData').doc('Billuload')
  .collection('technicians').add({
    technicianId: 'TECH001',
    name: 'Rahul Deshmukh',
    password: '12345',
    role: 'technician',
    email: 'rahul@example.com',
    phone: '+91-9876543210'
  });

// Add ticket
await db.collection('mainData').doc('Billuload')
  .collection('tickets').add({
    title: 'AC Not Cooling',
    customer: 'Sameer Khan',
    technicianId: 'TECH001',
    status: 'pending',
    description: 'Air conditioner is running but not cooling',
    serviceType: 'ATM (In Store)',
    priority: 'high',
    createdAt: new Date().toISOString()
  });
```

---

## 💡 Tips

1. **Use Auto-ID:** Let Firestore generate document IDs automatically
2. **Match technicianId:** Ensure exact match between technician and ticket
3. **Case Sensitive:** Technician IDs and passwords are case-sensitive
4. **Date Format:** Use ISO 8601 format for dates (YYYY-MM-DDTHH:mm:ssZ)
5. **Status Values:** Use lowercase: "pending", "in-progress", "completed"

---

## 🎉 Ready to Test!

Once you've added the test data, you can:
1. Navigate to `/technician/login`
2. Login with test credentials
3. View assigned tickets on the dashboard
4. Test different scenarios

Happy testing! 🚀
