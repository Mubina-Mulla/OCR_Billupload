# 🧾 Invoice Data Extractor for Indian GST Invoices

A comprehensive solution for extracting structured data from Indian GST tax invoices, specifically designed for electronics and home appliance distributors like Navaratna Distributors.

## 🚀 Features

- **OCR Error Handling**: Automatically corrects common OCR errors like character substitutions and merged words
- **Flexible Parsing**: Handles various invoice formats and layouts
- **Structured Output**: Extracts data into clean JSON format
- **GST Compliance**: Specifically designed for Indian GST invoice formats
- **Product Recognition**: Recognizes common electronics brands and products
- **Validation**: Built-in data validation and quality checks

## 📁 Files Structure

```
src/
├── utils/
│   ├── invoiceDataExtractor.js      # Main extractor class
│   ├── invoiceDataExtractor.test.js # Test cases and examples
│   └── integrationExample.js        # Integration helpers
├── components/
│   ├── InvoiceExtractor.js          # React component for UI
│   └── InvoiceExtractor.css         # Styling
└── INVOICE_EXTRACTOR_README.md      # This file
```

## 🛠️ Installation & Usage

### Basic Usage

```javascript
import { extractInvoiceData } from './utils/invoiceDataExtractor';

const rawInvoiceText = `
NAVARATNA DISTRIBUTORS
Invoice No: INV-001
Date: 15/03/2024

Buyer: Akash Anil Jagtap
Address: At Post Arjunwad Near Water Tank
Phone: 7387644884
State: Maharashtra Code: 27

Sr. Company Name Product Name HSN GST% Qty Rate Amount
1   Whirlpool   Ref DC 215 Impro Prm 5s Cool  84182100  18%  1 No.  17,900.00  15,169.49

GST @ 18%
Taxable Value: 15,169.49
CGST 9%: 1,365.25
SGST 9%: 1,365.25
Total Amount: 17,900.00
`;

const extractedData = extractInvoiceData(rawInvoiceText);
console.log(JSON.stringify(extractedData, null, 2));
```

### React Component Usage

```javascript
import InvoiceExtractor from './components/InvoiceExtractor';

function App() {
  return (
    <div className="App">
      <InvoiceExtractor />
    </div>
  );
}
```

### Integration with Existing Components

```javascript
import { processInvoiceForBillGenerator } from './utils/integrationExample';

const handleOCRResult = (ocrText) => {
  const result = processInvoiceForBillGenerator(ocrText);
  
  if (result.success) {
    // Use the processed data in your bill generator
    setBillData(result.data);
  } else {
    console.error('Extraction failed:', result.error);
  }
};
```

## 📊 Output Format

The extractor returns data in the following JSON structure:

```json
{
  "customer": {
    "name": "Akash Anil Jagtap",
    "address": "At Post Arjunwad Near Water Tank",
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
    }
  ],
  "gst": {
    "gstRate": "18%",
    "taxableValue": "15,169.49",
    "cgstRate": "9%",
    "cgstAmount": "1,365.25",
    "sgstRate": "9%",
    "sgstAmount": "1,365.25",
    "totalTax": "2,730.50",
    "roundOff": "0.00",
    "totalAmount": "17,900.00"
  }
}
```

## 🔧 Configuration

### Supported Company Names

The extractor recognizes these electronics brands:
- Whirlpool, LG, Samsung, Godrej, Haier
- Voltas, Blue Star, Carrier, Daikin
- Hitachi, Panasonic, Videocon, IFB, Bosch

### Supported Product Types

- Refrigerators, Air Conditioners, Washing Machines
- Microwaves, Coolers, Fans, Heaters, Geysers
- TVs (LED/LCD), Stands, Brackets

### OCR Error Handling

The extractor automatically handles:
- Character substitutions (|→I, O↔0)
- Merged words (WhirlpoolRef → Whirlpool Ref)
- Whitespace normalization
- Punctuation fixes

## 🧪 Testing

Run the test suite:

```javascript
import { runTests } from './utils/invoiceDataExtractor.test';
runTests();
```

Or test individual functions:

```javascript
import { validateExtractedData } from './utils/integrationExample';

const validation = validateExtractedData(extractedData);
console.log('Validation Score:', validation.score);
console.log('Issues:', validation.issues);
console.log('Warnings:', validation.warnings);
```

## 📈 Advanced Features

### Batch Processing

```javascript
import { processBatchInvoices } from './utils/integrationExample';

const invoiceTexts = [invoice1Text, invoice2Text, invoice3Text];
const results = processBatchInvoices(invoiceTexts);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Invoice ${index + 1} processed successfully`);
  } else {
    console.error(`Invoice ${index + 1} failed:`, result.error);
  }
});
```

### Export to Different Formats

```javascript
import { exportToFormats } from './utils/integrationExample';

const formats = exportToFormats(extractedData);
console.log('CSV:', formats.csv);
console.log('XML:', formats.xml);
console.log('JSON:', formats.json);
```

### Data Validation

```javascript
import { validateExtractedData } from './utils/integrationExample';

const validation = validateExtractedData(extractedData);

if (!validation.isValid) {
  console.log('Critical Issues:', validation.issues);
}

if (validation.hasWarnings) {
  console.log('Warnings:', validation.warnings);
}

console.log('Data Quality Score:', validation.score + '%');
```

## 🎯 Use Cases

1. **Automated Data Entry**: Convert scanned invoices to structured data
2. **Accounting Integration**: Import invoice data into accounting software
3. **Inventory Management**: Extract product information for stock tracking
4. **GST Compliance**: Ensure proper GST data extraction and validation
5. **Bulk Processing**: Process multiple invoices in batch operations

## 🔍 Troubleshooting

### Common Issues

1. **No data extracted**: Check if the input text contains recognizable invoice sections
2. **Missing customer info**: Ensure the text contains "Buyer" or "Customer" section headers
3. **No products found**: Verify the product table has numbered rows (1, 2, 3...)
4. **GST data missing**: Look for "GST @" or "Taxable Value" sections in the text

### Debug Mode

Enable detailed logging:

```javascript
const extractor = new InvoiceDataExtractor();
extractor.debug = true; // Enable debug logging
const result = extractor.extractInvoiceData(rawText);
```

### Custom Patterns

Extend the extractor for custom invoice formats:

```javascript
const extractor = new InvoiceDataExtractor();

// Add custom company names
extractor.companyNames.push('CustomBrand', 'LocalDistributor');

// Add custom patterns
extractor.patterns.customField = /custom[\s:]*([a-z0-9]+)/gi;

const result = extractor.extractInvoiceData(rawText);
```

## 📝 Contributing

To add support for new invoice formats:

1. Add test cases in `invoiceDataExtractor.test.js`
2. Update patterns in the main extractor class
3. Add company names or product keywords as needed
4. Test with real invoice samples

## 🚨 Important Notes

- **Data Privacy**: Ensure sensitive invoice data is handled securely
- **Accuracy**: Always validate extracted data before using in production
- **OCR Quality**: Better OCR input leads to better extraction results
- **Format Variations**: Test with various invoice formats from different distributors

## 📞 Support

For issues or questions:
1. Check the test cases for examples
2. Review the integration examples
3. Validate your input format matches supported patterns
4. Use the validation functions to identify data quality issues

---

**Happy Extracting! 🎉**
