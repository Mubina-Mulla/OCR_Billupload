// src/components/BillGenerator.js
import React, { useMemo, useState } from 'react';
import './BillGenerator.css';
import jsPDF from 'jspdf';

const BillGenerator = ({ customer, products = [], onBack }) => {
  const [status, setStatus] = useState('');

  // Only use the products passed as props, don't fetch from database
  // This ensures we only show the products that were actually added by the user
  const productsToUse = products;

  const totals = useMemo(() => {
    // Simple total calculation based on amount field from products
    const subtotal = productsToUse.reduce((acc, p) => {
      const amount = Number(p.amount ?? 0);
      return acc + amount;
    }, 0);
    
    // Calculate 18% GST
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  }, [productsToUse]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Navaratna Distributors', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('House No. 123, Station Road Mira 414510', 20, 30);
    doc.text('"Sumeet" G-5/973, Station Road Mira 414510', 20, 35);
    doc.text('GSTIN: 27AAWPF2848K1ZI', 20, 40);
    doc.text('Phone: +91 9876543210', 20, 45);
    
    // Invoice Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 105, 20, { align: 'center' });
    doc.setFontSize(8);
    doc.text('(ORIGINAL FOR RECIPIENT)', 105, 25, { align: 'center' });
    
    // Invoice Details Box
    doc.rect(150, 10, 50, 35);
    doc.setFontSize(9);
    doc.text(`Invoice No: ${customer?.id?.slice(-4) || '2668'}`, 152, 18);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 152, 25);
    doc.text('Vehicle No: -', 152, 32);
    doc.text('Salesman: Sachin', 152, 39);
    
    // Customer Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Buyer/Recipient:', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(customer?.name || 'Customer Name', 20, 68);
    doc.text(customer?.address || 'Customer Address', 20, 75);
    doc.text(`Phone: ${customer?.phone || 'Phone Number'}`, 20, 82);
    doc.text(`Contact Person: ${customer?.contactPerson || '-'}`, 20, 89);
    
    // Products Table - Manual creation
    let yPosition = 100;
    
    // Table Headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Sr.', 15, yPosition);
    doc.text('Company Name', 30, yPosition);
    doc.text('Serial Number', 70, yPosition);
    doc.text('Product Name', 110, yPosition);
    doc.text('Qty', 150, yPosition);
    doc.text('Price (₹)', 170, yPosition);
    doc.text('Amount (₹)', 190, yPosition);
    
    // Draw header line
    doc.line(10, yPosition + 2, 200, yPosition + 2);
    yPosition += 10;
    
    // Table Data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    productsToUse.forEach((product, index) => {
      const stock = Number(product.stock ?? 0);
      const price = Number(product.price ?? 0);
      const amount = Number(product.amount ?? (stock * price));
      
      doc.text((index + 1).toString(), 15, yPosition);
      doc.text(product.companyName || 'N/A', 30, yPosition);
      doc.text(product.serialNumber || 'N/A', 70, yPosition);
      doc.text(product.name || 'N/A', 110, yPosition);
      doc.text(stock.toString(), 150, yPosition);
      doc.text(`₹${price.toFixed(2)}`, 170, yPosition);
      doc.text(`₹${amount.toFixed(2)}`, 190, yPosition);
      
      yPosition += 8;
    });
    
    // Draw bottom line
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 10;
    
    // Add totals
    const finalY = yPosition;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: ₹${totals.subtotal.toFixed(2)}`, 150, finalY);
    doc.text(`Tax: ₹${totals.tax.toFixed(2)}`, 150, finalY + 7);
    doc.text(`Total: ₹${totals.total.toFixed(2)}`, 150, finalY + 14);
    
    // Terms and Conditions
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms and Conditions:', 20, finalY + 25);
    doc.text('This Statement Thousand Rupees Only', 20, finalY + 32);
    doc.text('Finance By: Bajaj Finance Ltd | Exchange: NO', 20, finalY + 39);
    
    // Save the PDF
    const fileName = `Bill_${customer?.name || 'Customer'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    // Show success message
    setStatus(`PDF saved as ${fileName}`);
    setTimeout(() => setStatus(''), 3000);
  };


  return (
    <div className="bill-wrapper">
      <div className="bill">
        {/* Header Section */}
        <div className="bill-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Navaratna Distributors</h1>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div>House No. 123, Station Road Mira 414510</div>
              <div>"Sumeet" G-5/973, Station Road Mira 414510</div>
              <div>GSTIN: 27AAWPF2848K1ZI</div>
              <div>Phone: +91 9876543210</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', textDecoration: 'underline' }}>TAX INVOICE</h2>
            <div style={{ fontSize: '10px', marginTop: '5px' }}>(ORIGINAL FOR RECIPIENT)</div>
          </div>
          <div style={{ textAlign: 'right', border: '1px solid #000', padding: '5px', minWidth: '150px' }}>
            <div style={{ fontSize: '11px', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '3px' }}>
              <strong>Invoice No:</strong> {customer?.id?.slice(-4) || '2668'}
            </div>
            <div style={{ fontSize: '11px', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '3px' }}>
              <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
            </div>
            <div style={{ fontSize: '11px', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '3px' }}>
              <strong>Vehicle No:</strong> -
            </div>
            <div style={{ fontSize: '11px', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '3px' }}>
              <strong>Salesman:</strong> Sachin
            </div>
            <div style={{ fontSize: '11px' }}>
              <strong>User Name:</strong> navaratna
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>Buyer/Recipient:</div>
          <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
            <div><strong>{customer?.name || 'Customer Name'}</strong></div>
            <div>{customer?.address || 'Customer Address'}</div>
            <div>Phone: {customer?.phone || 'Phone Number'}</div>
            <div>Contact Person: {customer?.contactPerson || '-'}</div>
            <div>Mobile No: {customer?.phone || '-'}</div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px' }}>
            <span style={{ marginRight: '20px' }}>Maharashtra Code: 27</span>
            <span>GSTIN: {customer?.gstin || '8600145337'}</span>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div style={{ marginBottom: '15px', textAlign: 'center', padding: '10px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '500' }}>{status}</div>
          </div>
        )}

        {/* Products Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', width: '5%' }}>Sr.</th>
              <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', width: '20%' }}>Company Name</th>
              <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', width: '15%' }}>Serial Number</th>
              <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', width: '25%' }}>Product Name</th>
              <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', width: '10%' }}>Stock Qty</th>
              <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'right', width: '12%' }}>Price (₹)</th>
              <th style={{ border: '1px solid #000', padding: '3px', textAlign: 'right', width: '13%' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {productsToUse.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ border: '1px solid #000', padding: '20px', textAlign: 'center' }}>No products added</td>
              </tr>
            ) : (
              productsToUse.map((p, idx) => {
                const stock = Number(p.stock ?? 0);
                const price = Number(p.price ?? 0);
                const amount = Number(p.amount ?? (stock * price));
                
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '3px' }}>{p.companyName || 'N/A'}</td>
                    <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{p.serialNumber || 'N/A'}</td>
                    <td style={{ border: '1px solid #000', padding: '3px' }}>{p.name || 'N/A'}</td>
                    <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{stock}</td>
                    <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{price.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{amount.toFixed(2)}</td>
                  </tr>
                );
              })
            )}
            {/* Empty rows to match invoice format */}
            {Array.from({ length: Math.max(0, 6 - productsToUse.length) }).map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td style={{ border: '1px solid #000', padding: '3px', height: '20px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
              <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>₹{totals.subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* GST Summary Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #000', padding: '3px', width: '15%' }}>GST Rate</th>
              <th style={{ border: '1px solid #000', padding: '3px', width: '15%' }}>Taxable Value</th>
              <th style={{ border: '1px solid #000', padding: '3px', width: '10%' }}>CGST Rate</th>
              <th style={{ border: '1px solid #000', padding: '3px', width: '15%' }}>CGST Amount</th>
              <th style={{ border: '1px solid #000', padding: '3px', width: '10%' }}>SGST/UTGST Rate</th>
              <th style={{ border: '1px solid #000', padding: '3px', width: '15%' }}>SGST/UTGST Amount</th>
              <th style={{ border: '1px solid #000', padding: '3px', width: '10%' }}>Total Tax Amount</th>
              <th style={{ border: '1px solid #000', padding: '3px', width: '10%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>18%</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{totals.subtotal.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>9%</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{(totals.tax / 2).toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>9%</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{(totals.tax / 2).toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{totals.tax.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right', fontWeight: 'bold' }}>{totals.total.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>
                Total: ₹ {totals.total.toFixed(2)}
              </td>
              <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                ₹ {totals.total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terms and Conditions */}
        <div style={{ fontSize: '10px', marginTop: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Terms and Conditions:</div>
          <div>This Statement Thousand Rupees Only</div>
          <div>Finance By: Bajaj Finance Ltd | Exchange: NO</div>
          <div>Down Pay: 4,330.00 | EMI Amount: 1,750.00 | EMI Months: 8 Months</div>
        </div>

        <div className="bill-actions">
          {onBack && (
            <button
              type="button"
              className="btn"
              onClick={onBack}
              style={{ background: '#6b7280', marginRight: 8 }}
            >
              ← Back
            </button>
          )}
          <button className="btn" onClick={handlePrint} style={{ marginRight: 8 }}>
            🖨️ Print Bill
          </button>
          <button className="btn" onClick={handleDownloadPDF} style={{ background: '#10b981' }}>
            📄 Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillGenerator;