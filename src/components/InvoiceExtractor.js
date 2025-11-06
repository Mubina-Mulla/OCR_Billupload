import React, { useState } from 'react';
import { extractInvoiceData } from '../utils/invoiceDataExtractor';
import './InvoiceExtractor.css';

const InvoiceExtractor = () => {
  const [rawText, setRawText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample invoice text for demo
  const sampleText = `NAVARATNA DISTRIBUTORS
GST NO: 27ABCDE1234F1Z5
Address: Shop No 123, Electronics Market, Pune - 411001
Phone: 020-12345678

Invoice No: INV-2024-001
Date: 15/03/2024

BUYER DETAILS:
Name: Akash Anil Jagtap
Address: At Post Arjunwad Near Water Tank
Kolhapur - 416312
Phone: 7387644884
Mobile: 8605136337
State: Maharashtra Code: 27
GSTIN: 27ABCPJ1234F1Z5

PRODUCT DETAILS:
Sr. Company Name Product Name Serial No HSN/SAC GST% Qty Incl.Rate Amount
1   Whirlpool   Ref DC 215 Impro Prm 5s Cool Illusi-72590  001  84182100  18%  1 No.  17,900.00  15,169.49
2   Generic     Ref Stand Black Metal Stand                  002  94036090  18%  1 No.  1,500.00   1,271.19

GST CALCULATION:
GST @ 18%
Taxable Value: 16,440.68
CGST 9%: 1,479.66
SGST 9%: 1,479.66
Total Tax: 2,959.32
Round Off: 0.00
Total Amount: 19,400.00`;

  const handleExtract = async () => {
    if (!rawText.trim()) {
      setError('Please enter invoice text to extract data');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const data = extractInvoiceData(rawText);
      setExtractedData(data);
    } catch (err) {
      setError(`Extraction failed: ${err.message}`);
      setExtractedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setRawText('');
    setExtractedData(null);
    setError('');
  };

  const handleLoadSample = () => {
    setRawText(sampleText);
    setError('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('JSON copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="invoice-extractor">
      <div className="header">
        <h1>🧾 Invoice Data Extractor</h1>
        <p>Extract structured data from Indian GST invoices</p>
      </div>

      <div className="input-section">
        <div className="input-header">
          <h3>Raw Invoice Text (OCR Output)</h3>
          <div className="input-actions">
            <button 
              onClick={handleLoadSample}
              className="btn btn-secondary"
              type="button"
            >
              Load Sample
            </button>
            <button 
              onClick={handleClear}
              className="btn btn-outline"
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
        
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste your raw invoice text here (from OCR or PDF parser)..."
          rows={12}
          className="raw-text-input"
        />
        
        <button 
          onClick={handleExtract}
          disabled={isLoading || !rawText.trim()}
          className="btn btn-primary extract-btn"
        >
          {isLoading ? '🔄 Extracting...' : '🚀 Extract Data'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {extractedData && (
        <div className="results-section">
          <div className="results-header">
            <h3>📊 Extracted Data</h3>
            <button 
              onClick={() => copyToClipboard(JSON.stringify(extractedData, null, 2))}
              className="btn btn-outline"
            >
              📋 Copy JSON
            </button>
          </div>

          <div className="data-preview">
            {/* Customer Section */}
            <div className="data-section">
              <h4>👤 Customer Information</h4>
              <div className="data-grid">
                <div className="data-item">
                  <label>Name:</label>
                  <span>{extractedData.customer.name || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>Address:</label>
                  <span>{extractedData.customer.address || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>Phone:</label>
                  <span>{extractedData.customer.phone || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>Mobile:</label>
                  <span>{extractedData.customer.mobile || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>State:</label>
                  <span>{extractedData.customer.state || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>State Code:</label>
                  <span>{extractedData.customer.stateCode || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>GSTIN:</label>
                  <span>{extractedData.customer.gstin || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="data-section">
              <h4>📦 Products ({extractedData.products.length})</h4>
              {extractedData.products.length > 0 ? (
                <div className="products-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Company</th>
                        <th>Product</th>
                        <th>HSN</th>
                        <th>GST%</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedData.products.map((product, index) => (
                        <tr key={index}>
                          <td>{product.srNo}</td>
                          <td>{product.companyName}</td>
                          <td>{product.productName}</td>
                          <td>{product.hsnSac}</td>
                          <td>{product.gstPercent}</td>
                          <td>{product.quantity}</td>
                          <td>{product.price}</td>
                          <td>{product.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No products found</p>
              )}
            </div>

            {/* GST Section */}
            <div className="data-section">
              <h4>💰 GST Summary</h4>
              <div className="data-grid">
                <div className="data-item">
                  <label>GST Rate:</label>
                  <span>{extractedData.gst.gstRate || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>Taxable Value:</label>
                  <span>{extractedData.gst.taxableValue || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>CGST Rate:</label>
                  <span>{extractedData.gst.cgstRate || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>CGST Amount:</label>
                  <span>{extractedData.gst.cgstAmount || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>SGST Rate:</label>
                  <span>{extractedData.gst.sgstRate || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>SGST Amount:</label>
                  <span>{extractedData.gst.sgstAmount || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>Total Tax:</label>
                  <span>{extractedData.gst.totalTax || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <label>Round Off:</label>
                  <span>{extractedData.gst.roundOff || 'N/A'}</span>
                </div>
                <div className="data-item total-amount">
                  <label>Total Amount:</label>
                  <span>{extractedData.gst.totalAmount || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw JSON Output */}
          <div className="json-output">
            <h4>📄 Raw JSON Output</h4>
            <pre>{JSON.stringify(extractedData, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="footer">
        <p>
          <strong>Instructions:</strong> Paste raw OCR text from Indian GST invoices. 
          The extractor handles common OCR errors and extracts customer info, products, and GST data.
        </p>
        <p>
          <strong>Supported formats:</strong> Electronics distributors like Navaratna Distributors, 
          home appliance invoices, and standard GST invoice formats.
        </p>
      </div>
    </div>
  );
};

export default InvoiceExtractor;
