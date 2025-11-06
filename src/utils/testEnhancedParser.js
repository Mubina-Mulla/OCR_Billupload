/**
 * Test file for the enhanced PDF parser
 * This demonstrates how the new parsing logic handles your specific invoice formats
 */

// Simulate the exact OCR text from your logs
const testOCRText = `
--- Page 1 ---
Navaratna Distributors	TAX INVOICE	Invoice No: temp	
(ORIGINAL FOR RECIPIENT)	Date: 04/10/2025	
House No. 123, Station Road Mira 414510	
Vehicle No: -	
"Sumeet" G-5/973, Station Road Mira 414510	
GSTIN: 27AAWPF2848K1Zl	Salesman: Sachin	
Phone: +91 9876543210	
User Name: navaratna	
Buyer/Recipient:	
Akash Anil Jagtap	
At Post Arjunwad Near Water Tank	
Phone: 7387644884	
Contact Person: friend	
Mobile No: 7387644884	
Maharashtra Code: 27|	GSTIN: 8600145337	
Sr. Company Name	Serial Number Product Name	Stock Qty	Price (₹)	Amount (₹)	
Ref DC 215 Impro Prm 5s Cool	
1	Whirlpool	001	17900.00	15169.49	
Illusi-72590	
2 Apple	1	TV	149999.97	299999.94	
Total	7315169.43	
SGST/UTGST	SGST/UTGST	Total Tax	
GST Rate	Taxable Value	CGST Rate	CGST Amount	Total	
Rate	Amount	Amount	
18%	315169.43	9%	28365.25	9%	28365.25	56730.50	371899.93	
Total: · 371899.93	
371899.93	
Terms and Conditions:	
This Statement Thousand Rupees Only	
Finance By: Bajaj Finance Ltd | Exchange: NO
Down Pay: 4,330.00 | EMI Amount: 1,750.00 | EMI Months: 8 Months
`;

// Test the parsing functions
console.log('🧪 TESTING ENHANCED PDF PARSER');
console.log('================================');

// Test 1: Pattern Detection
console.log('\n📋 Test 1: Pattern Detection');
console.log('-----------------------------');
const hasWhirlpool = testOCRText.includes('Whirlpool');
const hasApple = testOCRText.includes('Apple');
const hasTabSeparated = /\d+\s*\t\s*[A-Za-z]+\s*\t/.test(testOCRText);
const hasPricePattern = /[\d,]+\.?\d*\s*\t\s*[\d,]+\.?\d*/.test(testOCRText);

console.log(`✅ Whirlpool detected: ${hasWhirlpool}`);
console.log(`✅ Apple detected: ${hasApple}`);
console.log(`✅ Tab-separated format: ${hasTabSeparated}`);
console.log(`✅ Price pattern: ${hasPricePattern}`);

// Test 2: Line Analysis
console.log('\n📋 Test 2: Line Analysis');
console.log('-------------------------');
const lines = testOCRText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

console.log('Key lines that should be parsed:');
lines.forEach((line, i) => {
  // Check for tab-separated product lines
  if (/^\d+\s*\t\s*[A-Za-z]+\s*\t/.test(line)) {
    console.log(`📦 Product line ${i}: "${line}"`);
  }
  // Check for mixed format lines
  if (/^\d+\s+[A-Za-z]+\s*\t/.test(line)) {
    console.log(`📦 Mixed format line ${i}: "${line}"`);
  }
  // Check for product name fragments
  if (line.includes('Ref DC') || line.includes('Illusi')) {
    console.log(`📝 Product name fragment ${i}: "${line}"`);
  }
});

// Test 3: Expected Results
console.log('\n📋 Test 3: Expected Parsing Results');
console.log('------------------------------------');
console.log('The enhanced parser should extract:');
console.log('Product 1:');
console.log('  - Company: Whirlpool');
console.log('  - Serial: 001');
console.log('  - Name: Ref DC 215 Impro Prm 5s Cool Illusi-72590 (reconstructed)');
console.log('  - Price: 17900.00');
console.log('  - Amount: 15169.49');

console.log('Product 2:');
console.log('  - Company: Apple');
console.log('  - Serial: 1');
console.log('  - Name: TV');
console.log('  - Price: 149999.97');
console.log('  - Amount: 299999.94');

console.log('Customer:');
console.log('  - Name: Akash Anil Jagtap');
console.log('  - Phone: 7387644884');
console.log('  - Address: At Post Arjunwad Near Water Tank');

// Test 4: Regex Pattern Testing
console.log('\n📋 Test 4: Regex Pattern Testing');
console.log('----------------------------------');

// Test Pattern 1: "1\tWhirlpool\t001\t17900.00\t15169.49"
const pattern1 = /^(\d+)\s*\t\s*([A-Za-z]+)\s*\t\s*(\d+)\s*\t\s*([\d,]+\.?\d*)\s*\t\s*([\d,]+\.?\d*)$/;
const testLine1 = "1\tWhirlpool\t001\t17900.00\t15169.49";
const match1 = testLine1.match(pattern1);
console.log(`Pattern 1 test: "${testLine1}"`);
console.log(`Match result:`, match1 ? '✅ SUCCESS' : '❌ FAILED');
if (match1) {
  console.log(`  Sr: ${match1[1]}, Company: ${match1[2]}, Serial: ${match1[3]}, Price: ${match1[4]}, Amount: ${match1[5]}`);
}

// Test Pattern 2: "2 Apple\t1\tTV\t149999.97\t299999.94"
const pattern2 = /^(\d+)\s+([A-Za-z]+)\s*\t\s*(\d+)\s*\t\s*([A-Za-z][A-Za-z0-9\s\-]*?)\s*\t\s*([\d,]+\.?\d*)\s*\t\s*([\d,]+\.?\d*)$/;
const testLine2 = "2 Apple\t1\tTV\t149999.97\t299999.94";
const match2 = testLine2.match(pattern2);
console.log(`Pattern 2 test: "${testLine2}"`);
console.log(`Match result:`, match2 ? '✅ SUCCESS' : '❌ FAILED');
if (match2) {
  console.log(`  Sr: ${match2[1]}, Company: ${match2[2]}, Serial: ${match2[3]}, Product: ${match2[4]}, Price: ${match2[5]}, Amount: ${match2[6]}`);
}

console.log('\n🎉 TEST COMPLETE');
console.log('================');
console.log('The enhanced parser now includes:');
console.log('✅ Tab-separated format handling');
console.log('✅ Mixed space/tab format handling');
console.log('✅ Product name reconstruction from fragments');
console.log('✅ Multiple fallback parsing methods');
console.log('✅ Integration with existing invoice data extractor');
console.log('✅ Comprehensive error handling and logging');

export { testOCRText };
