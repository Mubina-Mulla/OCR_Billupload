# 🚀 Quick Setup Guide - Technician Login

## ⚡ Fast Setup (2 Steps)

### Step 1: Add Test Data to Firestore

Navigate to this URL in your browser:
```
http://localhost:3000/setup-test-data
```

Click the **"Add Test Data to Firestore"** button.

This will automatically add:
- ✅ 1 Technician (TECH001)
- ✅ 4 Test Tickets

### Step 2: Login as Technician

Navigate to:
```
http://localhost:3000/technician/login
```

Use these credentials:
- **Technician ID:** `TECH001`
- **Password:** `12345`

Click **Login** and you'll see the dashboard with 4 assigned tickets!

---

## 🎯 What You'll See

After logging in, the dashboard will show:
- **Total Tickets:** 4
- **Pending:** 2 tickets
- **In Progress:** 1 ticket
- **Completed:** 1 ticket

### Ticket Details:
1. **AC Not Cooling** (Pending)
2. **Refrigerator Making Noise** (In Progress)
3. **Washing Machine Repair** (Completed)
4. **Microwave Not Heating** (Pending)

---

## 🔧 Manual Setup (Alternative)

If you prefer to add data manually via Firebase Console:

### Add Technician:
Path: `mainData → Billuload → technicians → Add Document`

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

### Add Tickets:
Path: `mainData → Billuload → tickets → Add Document`

```javascript
{
  "title": "AC Not Cooling",
  "customer": "Sameer Khan",
  "technicianId": "TECH001",
  "status": "pending",
  "description": "Air conditioner is running but not cooling",
  "serviceType": "ATM (In Store)",
  "priority": "high"
}
```

**Important:** Make sure `technicianId` in tickets matches the technician's `technicianId`.

---

## ✅ Verification

After setup, verify:
- [ ] Can access `/technician/login`
- [ ] Can login with TECH001 / 12345
- [ ] Dashboard shows 4 tickets
- [ ] Stats show correct counts
- [ ] Can logout successfully

---

## 🎉 You're Ready!

The technician login system is now fully functional. Technicians can:
- Login with their ID and password
- View only their assigned tickets
- See ticket details and status
- Track their work statistics

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify Firestore rules allow read/write
3. Ensure Firebase is properly initialized
4. Check that collections exist in Firestore

Refer to `TECHNICIAN_LOGIN_README.md` for detailed documentation.
