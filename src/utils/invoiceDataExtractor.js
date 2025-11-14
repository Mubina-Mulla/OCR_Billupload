/**
 * Expert Invoice Data Extractor for Indian GST Tax Invoices
 * Specializes in electronics and home appliance distributors like Navaratna Distributors
 * Handles OCR errors and extracts structured data from raw text
 */

class InvoiceDataExtractor {
  constructor() {
    // Common patterns for different data types
    this.patterns = {
      phone: /(?:phone|ph|mobile|mob|contact)[\s:]*(\d{10})/gi,
      gstin: /(?:gstin|gst\s*no)[\s:]*([a-z0-9]{15})/gi,
      amount: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      percentage: /(\d{1,2}(?:\.\d{1,2})?)\s*%/g,
      hsnCode: /(\d{8})/g,
      stateCode: /(?:state\s*code|code)[\s:]*(\d{1,2})/gi,
      invoiceNumber: /(?:invoice|bill)\s*(?:no|number)[\s:]*([a-z0-9\-\/]+)/gi,
      date: /(?:date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi
    };

    // Common company names for better extraction - Enhanced with Racold and others
    this.companyNames = [
      'racold', 'whirlpool', 'lg', 'samsung', 'godrej', 'haier', 'voltas', 'blue star',
      'carrier', 'daikin', 'hitachi', 'panasonic', 'philips', 'phillips', 'videocon', 'ifb', 'bosch',
      'bajaj', 'havells', 'crompton', 'orient', 'usha', 'prestige', 'pigeon', 'butterfly',
      'preethi', 'sumeet', 'maharaja', 'kent', 'aquaguard', 'eureka', 'forbes', 'ao', 'smith', 'v-guard'
    ];

    // Common product keywords
    this.productKeywords = [
      'refrigerator', 'ref', 'fridge', 'ac', 'air conditioner', 'washing machine',
      'washer', 'microwave', 'oven', 'cooler', 'fan', 'heater', 'geyser',
      'television', 'tv', 'led', 'lcd', 'stand', 'bracket'
    ];
  }

  /**
   * Main extraction function
   * @param {string} rawText - Raw OCR text from invoice
   * @returns {Object} Structured invoice data
   */
  extractInvoiceData(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Invalid input: rawText must be a non-empty string');
    }

    // Preprocess the text
    const cleanedText = this.preprocessText(rawText);
    const lines = cleanedText.split('\n').filter(line => line.trim());

    // Extract different sections
    const customer = this.extractCustomerData(lines);
    const products = this.extractProductData(lines);
    const gst = this.extractGSTData(lines);

    return {
      customer,
      products,
      gst
    };
  }

  /**
   * Preprocess OCR text to handle common errors
   * @param {string} text - Raw OCR text
   * @returns {string} Cleaned text
   */
  preprocessText(text) {
    // Handle common OCR errors
    let cleaned = text
      // Fix common character substitutions
      .replace(/[|]/g, 'I')
      .replace(/[0O]/g, (match, offset, string) => {
        // Context-based O/0 correction
        const before = string.charAt(offset - 1);
        const after = string.charAt(offset + 1);
        if (/[a-zA-Z]/.test(before) || /[a-zA-Z]/.test(after)) {
          return 'O';
        }
        return /\d/.test(before) || /\d/.test(after) ? '0' : match;
      })
      // Fix merged words (common in OCR)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Fix common punctuation issues
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s*,\s*/g, ', ')
      .trim();

    return cleaned;
  }

  /**
   * Extract customer/buyer information
   * @param {Array} lines - Array of text lines
   * @returns {Object} Customer data
   */
  extractCustomerData(lines) {
    const customer = {
      name: '',
      address: '',
      phone: '',
      mobile: '',
      state: '',
      stateCode: '',
      gstin: '',
      contactPerson: ''
    };

    let inCustomerSection = false;
    let customerLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Detect customer section start
      if (line.includes('buyer') || line.includes('customer') || 
          line.includes('bill to') || line.includes('sold to')) {
        inCustomerSection = true;
        continue;
      }

      // Detect customer section end
      if (inCustomerSection && (line.includes('sr.') || line.includes('item') || 
          line.includes('product') || line.includes('description'))) {
        break;
      }

      if (inCustomerSection) {
        customerLines.push(lines[i]);
      }
    }

    // Extract customer name (usually first non-empty line)
    if (customerLines.length > 0) {
      customer.name = customerLines[0].trim();
    }

    // Extract address (combine multiple lines until phone/contact info)
    let addressLines = [];
    for (let i = 1; i < customerLines.length; i++) {
      const line = customerLines[i];
      if (this.containsPhoneNumber(line) || this.containsGSTIN(line) || 
          line.toLowerCase().includes('state')) {
        break;
      }
      addressLines.push(line.trim());
    }
    customer.address = addressLines.join(', ');

    // Extract phone numbers
    const phoneMatches = customerLines.join(' ').match(this.patterns.phone);
    if (phoneMatches && phoneMatches.length > 0) {
      customer.phone = phoneMatches[0];
      if (phoneMatches.length > 1) {
        customer.mobile = phoneMatches[1];
      }
    }

    // Extract GSTIN
    const gstinMatch = customerLines.join(' ').match(this.patterns.gstin);
    if (gstinMatch) {
      customer.gstin = gstinMatch[1];
    }

    // Extract state and state code
    for (const line of customerLines) {
      if (line.toLowerCase().includes('state')) {
        const stateCodeMatch = line.match(this.patterns.stateCode);
        if (stateCodeMatch) {
          customer.stateCode = stateCodeMatch[1];
        }
        
        // Extract state name
        const stateLine = line.replace(/state\s*code?\s*:?\s*\d*/gi, '').trim();
        if (stateLine) {
          customer.state = stateLine;
        }
      }
    }

    return customer;
  }

  /**
   * Extract product table data
   * @param {Array} lines - Array of text lines
   * @returns {Array} Array of product objects
   */
  extractProductData(lines) {
    const products = [];
    let inProductSection = false;
    let productLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Detect product section start
      if (line.includes('sr.') || line.includes('item') || 
          line.includes('product') || line.includes('description')) {
        inProductSection = true;
        continue;
      }

      // Detect product section end (GST table start)
      if (inProductSection && (line.includes('gst @') || line.includes('taxable value') || 
          line.includes('cgst') || line.includes('sgst'))) {
        break;
      }

      if (inProductSection) {
        productLines.push(lines[i]);
      }
    }

    // Parse product rows
    let currentProduct = null;
    for (const line of productLines) {
      const trimmedLine = line.trim();
      
      // Check if line starts with a number (new product row)
      const rowMatch = trimmedLine.match(/^(\d+)\s+(.+)/);
      if (rowMatch) {
        // Save previous product if exists
        if (currentProduct) {
          products.push(currentProduct);
        }
        
        // Start new product
        currentProduct = {
          srNo: rowMatch[1],
          companyName: '',
          productName: '',
          serialNo: '',
          hsnSac: '',
          gstPercent: '',
          quantity: '',
          price: '',
          amount: ''
        };

        // Parse the rest of the row
        this.parseProductRow(rowMatch[2], currentProduct);
      } else if (currentProduct && trimmedLine) {
        // Continuation of current product (multi-line)
        this.parseProductRow(trimmedLine, currentProduct);
      }
    }

    // Add last product
    if (currentProduct) {
      products.push(currentProduct);
    }

    return products;
  }

  /**
   * Parse a single product row or continuation
   * @param {string} rowText - Text content of the row
   * @param {Object} product - Product object to populate
   */
  parseProductRow(rowText, product) {
    // Extract company name
    if (!product.companyName) {
      for (const company of this.companyNames) {
        if (rowText.toLowerCase().includes(company)) {
          product.companyName = company.charAt(0).toUpperCase() + company.slice(1);
          break;
        }
      }
    }

    // Extract HSN code
    const hsnMatch = rowText.match(this.patterns.hsnCode);
    if (hsnMatch && !product.hsnSac) {
      product.hsnSac = hsnMatch[0];
    }

    // Extract GST percentage
    const gstMatch = rowText.match(this.patterns.percentage);
    if (gstMatch && !product.gstPercent) {
      product.gstPercent = gstMatch[0];
    }

    // Extract amounts
    const amounts = rowText.match(this.patterns.amount);
    if (amounts) {
      if (!product.price && amounts.length > 0) {
        product.price = amounts[amounts.length - 2] || amounts[0];
      }
      if (!product.amount && amounts.length > 0) {
        product.amount = amounts[amounts.length - 1];
      }
    }

    // Extract quantity (look for patterns like "1 No.", "2 Pcs", etc.)
    const qtyMatch = rowText.match(/(\d+)\s*(no|pcs|piece|unit|qty)\.?/gi);
    if (qtyMatch && !product.quantity) {
      product.quantity = qtyMatch[0];
    }

    // Extract product name (everything that's not company, HSN, GST, amounts)
    if (!product.productName) {
      let productName = rowText;
      
      // Remove extracted parts
      if (product.companyName) {
        productName = productName.replace(new RegExp(product.companyName, 'gi'), '');
      }
      if (product.hsnSac) {
        productName = productName.replace(product.hsnSac, '');
      }
      if (product.gstPercent) {
        productName = productName.replace(product.gstPercent, '');
      }
      if (amounts) {
        amounts.forEach(amount => {
          productName = productName.replace(amount, '');
        });
      }
      
      product.productName = productName.trim().replace(/\s+/g, ' ');
    }

    // Set serial number if not set (often same as sr.no or sequential)
    if (!product.serialNo) {
      product.serialNo = product.srNo;
    }
  }

  /**
   * Extract GST summary data
   * @param {Array} lines - Array of text lines
   * @returns {Object} GST data
   */
  extractGSTData(lines) {
    const gst = {
      gstRate: '',
      taxableValue: '',
      cgstRate: '',
      cgstAmount: '',
      sgstRate: '',
      sgstAmount: '',
      totalTax: '',
      roundOff: '',
      totalAmount: ''
    };

    let inGSTSection = false;
    let gstLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Detect GST section start
      if (line.includes('gst @') || line.includes('taxable value') || 
          line.includes('cgst') || line.includes('sgst')) {
        inGSTSection = true;
      }

      if (inGSTSection) {
        gstLines.push(lines[i]);
      }
    }

    const gstText = gstLines.join(' ');

    // Extract GST rate
    const gstRateMatch = gstText.match(/gst\s*@\s*(\d+%)/i);
    if (gstRateMatch) {
      gst.gstRate = gstRateMatch[1];
    }

    // Extract taxable value
    const taxableMatch = gstText.match(/taxable\s*value[:\s]*([0-9,]+\.?\d*)/i);
    if (taxableMatch) {
      gst.taxableValue = taxableMatch[1];
    }

    // Extract CGST
    const cgstRateMatch = gstText.match(/cgst[:\s]*(\d+%)/i);
    if (cgstRateMatch) {
      gst.cgstRate = cgstRateMatch[1];
    }
    const cgstAmountMatch = gstText.match(/cgst[:\s]*\d+%[:\s]*([0-9,]+\.?\d*)/i);
    if (cgstAmountMatch) {
      gst.cgstAmount = cgstAmountMatch[1];
    }

    // Extract SGST/UTGST
    const sgstRateMatch = gstText.match(/(?:sgst|utgst)[:\s]*(\d+%)/i);
    if (sgstRateMatch) {
      gst.sgstRate = sgstRateMatch[1];
    }
    const sgstAmountMatch = gstText.match(/(?:sgst|utgst)[:\s]*\d+%[:\s]*([0-9,]+\.?\d*)/i);
    if (sgstAmountMatch) {
      gst.sgstAmount = sgstAmountMatch[1];
    }

    // Extract total tax
    const totalTaxMatch = gstText.match(/total\s*tax[:\s]*([0-9,]+\.?\d*)/i);
    if (totalTaxMatch) {
      gst.totalTax = totalTaxMatch[1];
    }

    // Extract round off
    const roundOffMatch = gstText.match(/round\s*off[:\s]*([0-9,]+\.?\d*)/i);
    if (roundOffMatch) {
      gst.roundOff = roundOffMatch[1];
    }

    // Extract total amount
    const totalAmountMatch = gstText.match(/total\s*amount[:\s]*([0-9,]+\.?\d*)/i);
    if (totalAmountMatch) {
      gst.totalAmount = totalAmountMatch[1];
    }

    return gst;
  }

  /**
   * Helper function to check if line contains phone number
   * @param {string} line - Text line
   * @returns {boolean} True if contains phone number
   */
  containsPhoneNumber(line) {
    return this.patterns.phone.test(line);
  }

  /**
   * Helper function to check if line contains GSTIN
   * @param {string} line - Text line
   * @returns {boolean} True if contains GSTIN
   */
  containsGSTIN(line) {
    return this.patterns.gstin.test(line);
  }

  /**
   * Validate extracted data
   * @param {Object} data - Extracted invoice data
   * @returns {Object} Validation result with errors if any
   */
  validateData(data) {
    const errors = [];
    
    if (!data.customer.name) {
      errors.push('Customer name is missing');
    }
    
    if (data.products.length === 0) {
      errors.push('No products found');
    }
    
    if (!data.gst.totalAmount) {
      errors.push('Total amount is missing');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export the class and a convenience function
export default InvoiceDataExtractor;

/**
 * Convenience function to extract invoice data
 * @param {string} rawText - Raw OCR text from invoice
 * @returns {Object} Structured invoice data
 */
export const extractInvoiceData = (rawText) => {
  const extractor = new InvoiceDataExtractor();
  return extractor.extractInvoiceData(rawText);
};

/**
 * Example usage:
 * 
 * import { extractInvoiceData } from './utils/invoiceDataExtractor';
 * 
 * const rawBillText = `
 *   NAVARATNA DISTRIBUTORS
 *   Invoice No: INV-001
 *   Date: 15/03/2024
 *   
 *   Buyer: Akash Anil Jagtap
 *   Address: At Post Arjunwad Near Water Tank
 *   Phone: 7387644884
 *   Mobile: 8605136337
 *   State: Maharashtra Code: 27
 *   
 *   Sr. Company Name Product Name HSN GST% Qty Rate Amount
 *   1   Whirlpool   Ref DC 215 Impro Prm 5s Cool Illusi-72590  84182100  18%  1 No.  17,900.00  15,169.49
 *   
 *   GST @ 18%
 *   Taxable Value: 15,169.49
 *   CGST 9%: 1,365.25
 *   SGST 9%: 1,365.25
 *   Total Tax: 2,730.50
 *   Round Off: 0.01
 *   Total Amount: 17,900.00
 * `;
 * 
 * const invoiceData = extractInvoiceData(rawBillText);
 * console.log(JSON.stringify(invoiceData, null, 2));
 */
