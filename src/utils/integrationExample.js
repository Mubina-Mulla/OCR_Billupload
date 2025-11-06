/**
 * Integration Example: How to use Invoice Data Extractor with existing components
 * This shows how to integrate the extractor with your BillGenerator or other components
 */

import { extractInvoiceData } from './invoiceDataExtractor';

/**
 * Example 1: Integration with BillGenerator component
 * This function processes OCR text and converts it to the format expected by BillGenerator
 */
export const processInvoiceForBillGenerator = (ocrText) => {
  try {
    // Extract structured data from OCR text
    const extractedData = extractInvoiceData(ocrText);
    
    // Convert to BillGenerator format
    const billData = {
      // Customer information
      customer: {
        name: extractedData.customer.name,
        address: extractedData.customer.address,
        phone: extractedData.customer.phone,
        mobile: extractedData.customer.mobile,
        gstin: extractedData.customer.gstin,
        state: extractedData.customer.state,
        stateCode: extractedData.customer.stateCode
      },
      
      // Invoice details
      invoice: {
        number: '', // Extract from header if needed
        date: new Date().toISOString().split('T')[0], // Current date or extract from text
        dueDate: '', // Calculate based on terms
      },
      
      // Items/Products
      items: extractedData.products.map((product, index) => ({
        id: index + 1,
        description: `${product.companyName} ${product.productName}`.trim(),
        hsnCode: product.hsnSac,
        quantity: parseFloat(product.quantity?.replace(/[^\d.]/g, '') || '1'),
        unit: product.quantity?.replace(/[\d.]/g, '').trim() || 'No.',
        rate: parseFloat(product.price?.replace(/[^\d.]/g, '') || '0'),
        amount: parseFloat(product.amount?.replace(/[^\d.]/g, '') || '0'),
        gstRate: parseFloat(product.gstPercent?.replace(/[^\d.]/g, '') || '18'),
        serialNumber: product.serialNo
      })),
      
      // GST Summary
      gstSummary: {
        taxableValue: parseFloat(extractedData.gst.taxableValue?.replace(/[^\d.]/g, '') || '0'),
        cgstRate: parseFloat(extractedData.gst.cgstRate?.replace(/[^\d.]/g, '') || '9'),
        cgstAmount: parseFloat(extractedData.gst.cgstAmount?.replace(/[^\d.]/g, '') || '0'),
        sgstRate: parseFloat(extractedData.gst.sgstRate?.replace(/[^\d.]/g, '') || '9'),
        sgstAmount: parseFloat(extractedData.gst.sgstAmount?.replace(/[^\d.]/g, '') || '0'),
        totalTax: parseFloat(extractedData.gst.totalTax?.replace(/[^\d.]/g, '') || '0'),
        roundOff: parseFloat(extractedData.gst.roundOff?.replace(/[^\d.]/g, '') || '0'),
        totalAmount: parseFloat(extractedData.gst.totalAmount?.replace(/[^\d.]/g, '') || '0')
      }
    };
    
    return {
      success: true,
      data: billData,
      originalExtraction: extractedData
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Example 2: Batch processing multiple invoices
 */
export const processBatchInvoices = (invoiceTexts) => {
  const results = [];
  
  for (let i = 0; i < invoiceTexts.length; i++) {
    try {
      const extractedData = extractInvoiceData(invoiceTexts[i]);
      results.push({
        index: i,
        success: true,
        data: extractedData,
        error: null
      });
    } catch (error) {
      results.push({
        index: i,
        success: false,
        data: null,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Example 3: Validation and data quality check
 */
export const validateExtractedData = (extractedData) => {
  const issues = [];
  const warnings = [];
  
  // Check customer data
  if (!extractedData.customer.name) {
    issues.push('Customer name is missing');
  }
  
  if (!extractedData.customer.phone && !extractedData.customer.mobile) {
    warnings.push('No customer contact number found');
  }
  
  if (!extractedData.customer.gstin) {
    warnings.push('Customer GSTIN not found');
  }
  
  // Check products
  if (extractedData.products.length === 0) {
    issues.push('No products found in invoice');
  }
  
  extractedData.products.forEach((product, index) => {
    if (!product.productName) {
      issues.push(`Product ${index + 1}: Missing product name`);
    }
    if (!product.amount) {
      issues.push(`Product ${index + 1}: Missing amount`);
    }
    if (!product.hsnSac) {
      warnings.push(`Product ${index + 1}: Missing HSN/SAC code`);
    }
  });
  
  // Check GST data
  if (!extractedData.gst.totalAmount) {
    issues.push('Total amount is missing');
  }
  
  if (!extractedData.gst.taxableValue) {
    warnings.push('Taxable value not found');
  }
  
  return {
    isValid: issues.length === 0,
    hasWarnings: warnings.length > 0,
    issues,
    warnings,
    score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 5))
  };
};

/**
 * Example 4: Export to different formats
 */
export const exportToFormats = (extractedData) => {
  return {
    // CSV format for spreadsheet import
    csv: generateCSV(extractedData),
    
    // XML format for accounting software
    xml: generateXML(extractedData),
    
    // JSON format for APIs
    json: JSON.stringify(extractedData, null, 2)
  };
};

// Helper function to generate CSV
const generateCSV = (data) => {
  const headers = [
    'Customer Name', 'Customer Address', 'Customer Phone', 'Customer GSTIN',
    'Product Name', 'Company', 'HSN Code', 'Quantity', 'Rate', 'Amount', 'GST%',
    'Total Amount'
  ];
  
  let csv = headers.join(',') + '\n';
  
  data.products.forEach(product => {
    const row = [
      `"${data.customer.name}"`,
      `"${data.customer.address}"`,
      `"${data.customer.phone}"`,
      `"${data.customer.gstin}"`,
      `"${product.productName}"`,
      `"${product.companyName}"`,
      `"${product.hsnSac}"`,
      `"${product.quantity}"`,
      `"${product.price}"`,
      `"${product.amount}"`,
      `"${product.gstPercent}"`,
      `"${data.gst.totalAmount}"`
    ];
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

// Helper function to generate XML
const generateXML = (data) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<invoice>
  <customer>
    <name>${escapeXml(data.customer.name)}</name>
    <address>${escapeXml(data.customer.address)}</address>
    <phone>${escapeXml(data.customer.phone)}</phone>
    <gstin>${escapeXml(data.customer.gstin)}</gstin>
    <state>${escapeXml(data.customer.state)}</state>
  </customer>
  <products>
    ${data.products.map(product => `
    <product>
      <srNo>${escapeXml(product.srNo)}</srNo>
      <companyName>${escapeXml(product.companyName)}</companyName>
      <productName>${escapeXml(product.productName)}</productName>
      <hsnSac>${escapeXml(product.hsnSac)}</hsnSac>
      <gstPercent>${escapeXml(product.gstPercent)}</gstPercent>
      <quantity>${escapeXml(product.quantity)}</quantity>
      <price>${escapeXml(product.price)}</price>
      <amount>${escapeXml(product.amount)}</amount>
    </product>`).join('')}
  </products>
  <gst>
    <gstRate>${escapeXml(data.gst.gstRate)}</gstRate>
    <taxableValue>${escapeXml(data.gst.taxableValue)}</taxableValue>
    <cgstAmount>${escapeXml(data.gst.cgstAmount)}</cgstAmount>
    <sgstAmount>${escapeXml(data.gst.sgstAmount)}</sgstAmount>
    <totalTax>${escapeXml(data.gst.totalTax)}</totalTax>
    <totalAmount>${escapeXml(data.gst.totalAmount)}</totalAmount>
  </gst>
</invoice>`;
};

// Helper function to escape XML
const escapeXml = (str) => {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Example usage in a React component:
 * 
 * import { processInvoiceForBillGenerator, validateExtractedData } from '../utils/integrationExample';
 * 
 * const handleOCRResult = (ocrText) => {
 *   const result = processInvoiceForBillGenerator(ocrText);
 *   
 *   if (result.success) {
 *     const validation = validateExtractedData(result.originalExtraction);
 *     
 *     if (validation.isValid) {
 *       // Use the data in BillGenerator
 *       setBillData(result.data);
 *     } else {
 *       // Show validation errors
 *       setErrors(validation.issues);
 *     }
 *   } else {
 *     setError(result.error);
 *   }
 * };
 */
