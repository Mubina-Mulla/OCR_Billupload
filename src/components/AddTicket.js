import React, { useState, useEffect } from "react";
import { addDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, getCollectionRef, getDocRef } from "../firebase/config";
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
    callId: "", // New field for Demo and Service categories
    uniqueId: "", // New unique ID field for Demo and Service categories
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
    category: "Demo",
    issueType: "",
    subOption: "",
    priority: "Medium",
    status: "Pending",
    serviceAmount: "",
    commissionAmount: "",
    amountReceived: "",
    note: "",
    createdAt: new Date().toISOString(),
    endDate: "",
  });

  const [serviceCenters, setServiceCenters] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const receivedOptions = ["By Store", "By Technician"];

  // Fetch service centers from Firebase
  useEffect(() => {
    const servicesRef = getCollectionRef('services');
    const unsubscribe = onSnapshot(servicesRef, (snapshot) => {
      const centersArray = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().serviceCenterName,
        ...doc.data()
      }));
      console.log('📍 Loaded Service Centers:', centersArray.length, centersArray);
      setServiceCenters(centersArray);
    });
    return () => unsubscribe();
  }, []);

  // Fetch technicians from Firebase
  useEffect(() => {
    const techRef = getCollectionRef('technicians');
    const unsubscribe = onSnapshot(techRef, (snapshot) => {
      const techArray = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        ...doc.data()
      }));
      setTechnicians(techArray);
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
      }));
    } else if (productData?.serialNumber) {
      setFormData((prev) => ({
        ...prev,
        serialNumber: productData.serialNumber,
      }));
    }
  }, [ticketData, productData, customer, prefilledData]);

  // Auto-select matching service center when company name matches
  useEffect(() => {
    // Only auto-select if category is Demo or Service and no service center is selected yet
    if ((formData.category === "Demo" || formData.category === "Service") && 
        !formData.subOption && 
        serviceCenters.length > 0) {
      
      const productCompany = (formData.companyName || formData.brand || '').toLowerCase().trim();
      
      if (productCompany) {
        // Find exact matching service center
        const matchingCenter = serviceCenters.find(center => {
          const centerCompany = (center.companyName || '').toLowerCase().trim();
          return centerCompany === productCompany || 
                 centerCompany.includes(productCompany) || 
                 productCompany.includes(centerCompany);
        });
        
        if (matchingCenter) {
          console.log('🎯 Auto-selecting service center:', matchingCenter.serviceCenterName);
          setFormData(prev => ({
            ...prev,
            subOption: matchingCenter.serviceCenterName || matchingCenter.name
          }));
        }
      }
    }
  }, [formData.category, formData.companyName, formData.brand, serviceCenters, formData.subOption]);

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
          const servicesRef = getCollectionRef('services');
          const newServiceData = {
            companyName: formData.companyName || formData.brand || 'N/A',
            serviceCenterName: formData.subOption,
            address: 'Auto-generated from ticket - Please update',
            mobileNumber: formData.customerPhone || '0000000000',
            createdAt: new Date().toISOString(),
            autoCreated: true,
            category: formData.category
          };
          await addDoc(servicesRef, newServiceData);
          console.log('✅ Auto-created service center:', formData.subOption);
          showNotification(`Service center "${formData.subOption}" added to Service Center page!`, 'info');
        }
      }

      if (ticketData && ticketData.id) {
        const ticketRef = getDocRef('tickets', ticketData.id);
        await updateDoc(ticketRef, formData);
        showNotification("Ticket updated successfully!", "success");
        if (onTicketUpdated) onTicketUpdated();
      } else {
        const ticketsRef = getCollectionRef("tickets");
        await addDoc(ticketsRef, formData);
        showNotification("Ticket added successfully!", "success");
        if (onTicketAdded) onTicketAdded();
      }

      if (!ticketData) {
        setFormData({
          ticketNumber: generateTicketNumber(),
          customerName: customer?.name || "",
          customerPhone: customer?.phone || "",
          callId: "",
          uniqueId: "",
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
          note: "",
          createdAt: new Date().toISOString(),
          endDate: "",
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

  // Smart filtering: Show matching service centers first, then others
  const productCompany = (formData.companyName || formData.brand || '').toLowerCase().trim();
  
  const filteredServiceCenters = serviceCenters.sort((a, b) => {
    const aCompany = (a.companyName || '').toLowerCase().trim();
    const bCompany = (b.companyName || '').toLowerCase().trim();
    
    // Check if company names match the product company
    const aMatches = productCompany && (
      aCompany.includes(productCompany) || 
      productCompany.includes(aCompany)
    );
    const bMatches = productCompany && (
      bCompany.includes(productCompany) || 
      productCompany.includes(bCompany)
    );
    
    // Sort matching companies first
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    
    // Then sort alphabetically
    return (a.companyName || '').localeCompare(b.companyName || '');
  });

  // Separate matching and non-matching service centers for display
  const matchingCenters = filteredServiceCenters.filter(center => {
    const centerCompany = (center.companyName || '').toLowerCase().trim();
    return productCompany && (
      centerCompany.includes(productCompany) || 
      productCompany.includes(centerCompany)
    );
  });

  // Debug log for service centers
  console.log('🔍 Service Centers Available:', {
    total: serviceCenters.length,
    productCompany: formData.companyName || formData.brand,
    matching: matchingCenters.length,
    matchingCenters: matchingCenters.map(c => ({ company: c.companyName, name: c.serviceCenterName })),
    allCenters: filteredServiceCenters.map(c => ({ company: c.companyName, name: c.serviceCenterName }))
  });

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

              {/* DATE FIELDS */}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.createdAt ? new Date(formData.createdAt).toISOString().split('T')[0] : ''}
                    readOnly
                    className="readonly-field"
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.createdAt ? new Date(formData.createdAt).toISOString().split('T')[0] : ''}
                  />
                </div>
              </div>

              {/* Call ID field for Demo and Service categories */}
              {(formData.category === "Demo" || formData.category === "Service") && (
                <div className="form-group">
                  <label>Call ID</label>
                  <input
                    type="text"
                    name="callId"
                    value={formData.callId}
                    onChange={handleChange}
                    placeholder="Enter Call ID"
                    required
                  />
                </div>
              )}

              {/* Service Center for Demo and Service */}
              {showServiceCenters && (
                <>
                  <div className="form-group full-width">
                    <label>Service Center</label>
                    <select
                      name="subOption"
                      value={formData.subOption}
                      onChange={handleChange}
                      required
                    >
                      <option value="">✓ Select Service Center</option>
                      {filteredServiceCenters.length > 0 ? (
                        <>
                          {matchingCenters.length > 0 && (
                            <optgroup label={`✨ Recommended for ${formData.companyName || formData.brand}`}>
                              {matchingCenters.map((center, idx) => (
                                <option key={center.id || idx} value={center.serviceCenterName || center.name}>
                                  {center.companyName ? `${center.companyName} - ${center.serviceCenterName || center.name}` : (center.serviceCenterName || center.name)}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {filteredServiceCenters.filter(center => {
                            const centerCompany = (center.companyName || '').toLowerCase().trim();
                            const matches = productCompany && (
                              centerCompany.includes(productCompany) || 
                              productCompany.includes(centerCompany)
                            );
                            return !matches;
                          }).length > 0 && (
                            <optgroup label="📋 Other Service Centers">
                              {filteredServiceCenters.filter(center => {
                                const centerCompany = (center.companyName || '').toLowerCase().trim();
                                const matches = productCompany && (
                                  centerCompany.includes(productCompany) || 
                                  productCompany.includes(centerCompany)
                                );
                                return !matches;
                              }).map((center, idx) => (
                                <option key={center.id || idx} value={center.serviceCenterName || center.name}>
                                  {center.companyName ? `${center.companyName} - ${center.serviceCenterName || center.name}` : (center.serviceCenterName || center.name)}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      ) : (
                        <option disabled>No service centers available. Please add one from Services page.</option>
                      )}
                      <option value="__new__">+ Add New Service Center</option>
                    </select>
                    <small style={{color: '#6b7280', display: 'block', marginTop: '0.25rem'}}>
                      {matchingCenters.length > 0 
                        ? `✨ ${matchingCenters.length} matching service center(s) for ${formData.companyName || formData.brand} | ${filteredServiceCenters.length} total` 
                        : filteredServiceCenters.length > 0 
                          ? `📋 ${filteredServiceCenters.length} service center(s) available (no exact match for ${formData.companyName || formData.brand})`
                          : '⚠️ No service centers found. Add them from Services page.'}
                    </small>
                  </div>
                  {formData.subOption === "__new__" && (
                    <div className="form-group full-width">
                      <label>New Service Center Name *</label>
                      <input
                        type="text"
                        placeholder="Enter new service center name"
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, subOption: e.target.value }));
                        }}
                        required
                      />
                      <small style={{color: '#6b7280', display: 'block', marginTop: '0.25rem'}}>
                        ✨ This service center will be automatically added to the Service Center page
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

                  <div className="form-group full-width">
                    <label>📝 Note / Description</label>
                    <textarea
                      name="note"
                      placeholder="Add a note or description for this ticket..."
                      value={formData.note}
                      onChange={handleChange}
                      rows="4"
                    />
                    <small style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Add any additional notes or special instructions for this ticket
                    </small>
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