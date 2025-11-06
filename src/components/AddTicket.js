import React, { useState, useEffect } from "react";
import { ref, push, update, onValue } from "firebase/database";
import { db } from "../firebase/config";
import Notification from "./Notification";
import useNotification from "../hooks/useNotification";
import "./AddTicket.css";

const AddTicket = ({
  onBack,
  onTicketAdded,
  onTicketUpdated,
  productData,
  ticketData,
  customer,
  prefilledData,
}) => {
  const { notification, showNotification, hideNotification } = useNotification();

  const generateTicketNumber = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  const issueTypes = {
    Demo: ["Product Demonstration", "Setup Assistance", "Training", "Technical Overview"],
    Service: ["Repair", "Maintenance", "Calibration", "Diagnostic", "Parts Replacement"],
    "Third Party": ["Warranty Claim", "External Repair", "Vendor Service", "Collaborative Fix"],
    "In Store": ["Quick Fix", "Assessment", "Minor Repair", "Consultation"],
  };

  const [formData, setFormData] = useState({
    ticketNumber: generateTicketNumber(),
    customerName: prefilledData?.customerName || customer?.name || "",
    customerPhone: prefilledData?.customerPhone || customer?.phone || "",
    productName: prefilledData?.productName || productData?.name || "",
    serialNumber: prefilledData?.serialNumber || productData?.serialNumber || "",
    companyName:
      prefilledData?.companyName ||
      prefilledData?.brand ||
      productData?.brand ||
      productData?.companyName ||
      "",
    brand: prefilledData?.brand || productData?.brand || "",
    model: prefilledData?.model || productData?.model || "",
    price: prefilledData?.price || productData?.price || "",
    category: "Demo",
    issueType: "",
    subOption: "",
    priority: "Medium",
    status: "Pending",
    serviceAmount: "",
    commissionAmount: "",
    amountReceived: "",
    createdAt: new Date().toISOString(),
  });

  const [serviceCenters, setServiceCenters] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const receivedOptions = ["By Store", "By Technician"];

  // Fetch service centers from Firebase
  useEffect(() => {
    const servicesRef = ref(db, 'services');
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const centersArray = Object.keys(data).map(key => ({
          id: key,
          name: data[key].serviceCenterName,
          ...data[key]
        }));
        setServiceCenters(centersArray);
      } else {
        setServiceCenters([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch technicians from Firebase
  useEffect(() => {
    const techRef = ref(db, 'technicians');
    const unsubscribe = onValue(techRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const techArray = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name,
          ...data[key]
        }));
        setTechnicians(techArray);
      } else {
        setTechnicians([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (ticketData) {
      setFormData({
        ...formData,
        ...ticketData,
        ticketNumber: ticketData.ticketNumber || generateTicketNumber(),
        createdAt: ticketData.createdAt || new Date().toISOString(),
      });
    } else if (prefilledData) {
      setFormData((prev) => ({
        ...prev,
        customerName: prefilledData.customerName || "",
        customerPhone: prefilledData.customerPhone || "",
        productName: prefilledData.productName || "",
        serialNumber: prefilledData.serialNumber || "",
        companyName: prefilledData.companyName || prefilledData.brand || "",
        brand: prefilledData.brand || "",
        model: prefilledData.model || "",
        price: prefilledData.price || "",
      }));
    } else if (productData?.serialNumber) {
      setFormData((prev) => ({
        ...prev,
        serialNumber: productData.serialNumber,
      }));
    }
  }, [ticketData, productData, customer, prefilledData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        issueType: "",
        subOption: "",
        serviceAmount: "",
        commissionAmount: "",
        amountReceived: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName) {
      showNotification("Please enter customer name", "warning");
      return;
    }
    if (!formData.issueType) {
      showNotification("Please select an issue type", "warning");
      return;
    }
    if (!formData.subOption || formData.subOption === "__new__") {
      showNotification("Please enter a service center or technician name", "warning");
      return;
    }

    try {
      // Auto-create service center if category is "Service" or "Demo" and it's a new service center
      if ((formData.category === "Service" || formData.category === "Demo") && formData.subOption) {
        const existingService = serviceCenters.find(
          sc => sc.serviceCenterName === formData.subOption || sc.name === formData.subOption
        );
        
        if (!existingService) {
          // Create new service center automatically
          const servicesRef = ref(db, 'services');
          const newServiceData = {
            companyName: formData.companyName || formData.brand || 'N/A',
            serviceCenterName: formData.subOption,
            address: 'Auto-generated from ticket - Please update',
            mobileNumber: formData.customerPhone || '0000000000',
            createdAt: new Date().toISOString(),
            autoCreated: true,
            category: formData.category
          };
          await push(servicesRef, newServiceData);
          console.log('✅ Auto-created service center:', formData.subOption);
          showNotification(`Service center "${formData.subOption}" added to Service Center page!`, 'info');
        }
      }

      if (ticketData && ticketData.id) {
        const ticketRef = ref(db, `tickets/${ticketData.id}`);
        await update(ticketRef, formData);
        showNotification("Ticket updated successfully!", "success");
        if (onTicketUpdated) onTicketUpdated();
      } else {
        const ticketsRef = ref(db, "tickets");
        await push(ticketsRef, formData);
        showNotification("Ticket added successfully!", "success");
        if (onTicketAdded) onTicketAdded();
      }

      if (!ticketData) {
        setFormData({
          ticketNumber: generateTicketNumber(),
          customerName: customer?.name || "",
          productName: productData?.name || "",
          serialNumber: productData?.serialNumber || "",
          category: "Demo",
          issueType: "",
          subOption: "",
          priority: "Medium",
          status: "Pending",
          serviceAmount: "",
          commissionAmount: "",
          amountReceived: "",
          createdAt: new Date().toISOString(),
        });
      }

      if (onBack) onBack();
    } catch (err) {
      console.error("Error saving ticket:", err);
      showNotification("Failed to save ticket. Try again.", "error");
    }
  };

  // Conditional rendering variables
  const showServiceCenters = formData.category === "Demo" || formData.category === "Service";
  const showTechnicians = formData.category === "Third Party" || formData.category === "In Store";
  const showExtraAmounts = formData.category === "Third Party" || formData.category === "In Store";

  return (
    <div className="add-ticket">
      <div className="add-ticket-header">
        <h1>{ticketData ? "Edit Ticket" : "Create Ticket"}</h1>
      </div>

      <div className="add-ticket-container">
        <div className="add-ticket-card">
          <form onSubmit={handleSubmit} className="ticket-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Ticket Number</label>
                <input type="text" value={formData.ticketNumber} readOnly />
              </div>

              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  readOnly
                />
              </div>

              {/* PRODUCT INFO */}
              <div className="product-details-section">
                <h3>Product Information</h3>

                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    value={
                      formData.companyName ||
                      formData.brand ||
                      productData?.companyName ||
                      ""
                    }
                    readOnly
                    className="readonly-field"
                  />
                </div>

                <div className="form-group">
                  <label>Serial Number *</label>
                  <input
                    type="text"
                    value={
                      formData.serialNumber ||
                      productData?.serialNo ||
                      productData?.serialNumber ||
                      ""
                    }
                    readOnly
                    className="readonly-field"
                  />
                </div>

                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.productName || productData?.name || ""}
                    readOnly
                    className="readonly-field"
                  />
                </div>

                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="text"
                    value={`₹${parseFloat(formData.price || 0).toFixed(2)}`}
                    readOnly
                    className="readonly-field"
                  />
                </div>
              </div>

              {/* CATEGORY SELECTION */}
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="Demo">Demo</option>
                  <option value="Service">Service</option>
                  <option value="Third Party">Third Party</option>
                  <option value="In Store">In Store</option>
                </select>
              </div>

              <div className="form-group">
                <label>Issue Type</label>
                <select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Issue Type</option>
                  {issueTypes[formData.category]?.map((issue, index) => (
                    <option key={index} value={issue}>
                      {issue}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Service Center for Demo and Service */}
              {showServiceCenters && (
                <>
                  <div className="form-group full-width">
                    <label>
                      {formData.category === "Demo" ? "Demo Center" : "Service Center"}
                    </label>
                    <select
                      name="subOption"
                      value={formData.subOption}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select {formData.category === "Demo" ? "Demo Center" : "Service Center"}</option>
                      {serviceCenters.map((center, idx) => (
                        <option key={idx} value={center.serviceCenterName || center.name}>
                          {center.serviceCenterName || center.name}
                        </option>
                      ))}
                      <option value="__new__">+ Add New {formData.category === "Demo" ? "Demo Center" : "Service Center"}</option>
                    </select>
                  </div>
                  {formData.subOption === "__new__" && (
                    <div className="form-group full-width">
                      <label>New {formData.category === "Demo" ? "Demo Center" : "Service Center"} Name *</label>
                      <input
                        type="text"
                        placeholder={`Enter new ${formData.category === "Demo" ? "demo center" : "service center"} name`}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, subOption: e.target.value }));
                        }}
                        required
                      />
                      <small style={{color: '#6b7280', display: 'block', marginTop: '0.25rem'}}>
                        ✨ This {formData.category === "Demo" ? "demo center" : "service center"} will be automatically added to the Service Center page
                      </small>
                    </div>
                  )}
                </>
              )}

              {/* Technician for Third Party and In Store */}
              {showTechnicians && (
                <div className="form-group full-width">
                  <label>Technician</label>
                  <select
                    name="subOption"
                    value={formData.subOption}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Technician</option>
                    {technicians.map((tech, idx) => (
                      <option key={idx} value={tech.name}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* EXTRA AMOUNTS for Third Party & In Store */}
              {showExtraAmounts && (
                <>
                  <div className="form-group">
                    <label>Service Amount</label>
                    <input
                      type="number"
                      name="serviceAmount"
                      placeholder="Enter Service Amount"
                      value={formData.serviceAmount}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Commission Amount</label>
                    <input
                      type="number"
                      name="commissionAmount"
                      placeholder="Enter Commission Amount"
                      value={formData.commissionAmount}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Amount Received</label>
                    <select
                      name="amountReceived"
                      value={formData.amountReceived}
                      onChange={handleChange}
                    >
                      <option value="">Select Option</option>
                      {receivedOptions.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {ticketData ? "Update Ticket" : "Add Ticket"}
              </button>
              <button type="button" className="btn-secondary" onClick={onBack}>
                Back
              </button>
            </div>
          </form>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
};

export default AddTicket;