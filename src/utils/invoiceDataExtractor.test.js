/**
 * Test cases for Invoice Data Extractor
 * Includes sample invoice texts and expected outputs
 */

import { extractInvoiceData } from './invoiceDataExtractor';

// Sample invoice text (simulating OCR output with potential errors)
const sampleInvoiceText1 = `
NAVARATNA DISTRIBUTORS
GST NO: 27ABCDE1234F1Z5
Address: Shop No 123, Electronics Market, Pune - 411001
Phone: 020-12345678

Invoice No: INV-2024-001
Date: 15/03/2024
Vehicle No: MH12AB1234
Salesman: Rajesh Kumar

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
Total Amount: 19,400.00
`;

const sampleInvoiceText2 = `
ELECTRONICS WORLD
GSTIN: 29ABCDE5678G2H6
Mumbai, Maharashtra - 400001

Bill No: EW-2024-0156
Date: 22/03/2024

Customer Information:
Priya Sharma
Flat 301, Sunrise Apartments
Andheri West, Mumbai - 400058
Contact: 9876543210
State: Maharashtra (29)

Item Details:
1. Samsung LED TV 43 inch Smart TV Series 7   HSN: 85287200   18%   1 Unit   35,000.00   29,661.02
2. TV Wall Mount Bracket Heavy Duty            HSN: 94036090   18%   1 Pc     2,000.00    1,694.92

Tax Summary:
Taxable Amount: 31,355.94
CGST @ 9%: 2,822.03
SGST @ 9%: 2,822.03
Total Tax: 5,644.06
Grand Total: 37,000.00
`;

// Test function
function runTests() {
  console.log('=== Invoice Data Extractor Tests ===\n');

  // Test 1: Navaratna Distributors Invoice
  console.log('Test 1: Navaratna Distributors Invoice');
  console.log('=====================================');
  
  try {
    const result1 = extractInvoiceData(sampleInvoiceText1);
    console.log('Extracted Data:');
    console.log(JSON.stringify(result1, null, 2));
    
    // Validate key fields
    console.log('\nValidation:');
    console.log('✓ Customer name:', result1.customer.name ? 'Found' : 'Missing');
    console.log('✓ Customer phone:', result1.customer.phone ? 'Found' : 'Missing');
    console.log('✓ Products count:', result1.products.length);
    console.log('✓ Total amount:', result1.gst.totalAmount ? 'Found' : 'Missing');
    
  } catch (error) {
    console.error('Error in Test 1:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Electronics World Invoice
  console.log('Test 2: Electronics World Invoice');
  console.log('=================================');
  
  try {
    const result2 = extractInvoiceData(sampleInvoiceText2);
    console.log('Extracted Data:');
    console.log(JSON.stringify(result2, null, 2));
    
    // Validate key fields
    console.log('\nValidation:');
    console.log('✓ Customer name:', result2.customer.name ? 'Found' : 'Missing');
    console.log('✓ Customer phone:', result2.customer.phone ? 'Found' : 'Missing');
    console.log('✓ Products count:', result2.products.length);
    console.log('✓ Total amount:', result2.gst.totalAmount ? 'Found' : 'Missing');
    
  } catch (error) {
    console.error('Error in Test 2:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Error handling
  console.log('Test 3: Error Handling');
  console.log('=====================');
  
  try {
    const result3 = extractInvoiceData('');
    console.log('Should have thrown error for empty input');
  } catch (error) {
    console.log('✓ Correctly handled empty input:', error.message);
  }

  try {
    const result4 = extractInvoiceData(null);
    console.log('Should have thrown error for null input');
  } catch (error) {
    console.log('✓ Correctly handled null input:', error.message);
  }
}

// Expected output format for reference
const expectedOutputFormat = {
  "customer": {
    "name": "Akash Anil Jagtap",
    "address": "At Post Arjunwad Near Water Tank, Kolhapur - 416312",
    "phone": "7387644884",
    "mobile": "8605136337",
    "state": "Maharashtra",
    "stateCode": "27",
    "gstin": "27ABCPJ1234F1Z5",
    "contactPerson": ""
  },
  "products": [
    {
      "srNo": "1",
      "companyName": "Whirlpool",
      "productName": "Ref DC 215 Impro Prm 5s Cool Illusi-72590",
      "serialNo": "001",
      "hsnSac": "84182100",
      "gstPercent": "18%",
      "quantity": "1 No.",
      "price": "17,900.00",
      "amount": "15,169.49"
    },
    {
      "srNo": "2",
      "companyName": "Generic",
      "productName": "Ref Stand Black Metal Stand",
      "serialNo": "002",
      "hsnSac": "94036090",
      "gstPercent": "18%",
      "quantity": "1 No.",
      "price": "1,500.00",
      "amount": "1,271.19"
    }
  ],
  "gst": {
    "gstRate": "18%",
    "taxableValue": "16,440.68",
    "cgstRate": "9%",
    "cgstAmount": "1,479.66",
    "sgstRate": "9%",
    "sgstAmount": "1,479.66",
    "totalTax": "2,959.32",
    "roundOff": "0.00",
    "totalAmount": "19,400.00"
  }
};

// Export test function for use in other files
export { runTests, sampleInvoiceText1, sampleInvoiceText2, expectedOutputFormat };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}
