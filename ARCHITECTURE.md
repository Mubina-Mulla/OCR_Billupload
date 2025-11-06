# System Architecture - Dynamic Product Extraction

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER UPLOADS BILL                         │
│                    (PDF or Image File)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AddCustomer.js                               │
│                  handleBillUpload()                             │
│  • Receives file from input                                     │
│  • Shows "Scanning bill..." notification                        │
│  • Calls parsePdfToData(file)                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    pdfParser.js                                 │
│                  parsePdfToData()                               │
│  • Detects file type (PDF or Image)                            │
│  • Extracts text using OCR                                      │
│  • Calls parseCustomerDetails()                                 │
│  • Calls parseProductDetails() ← MAIN FUNCTION                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              parseProductDetails() - Strategy Pattern            │
│  Tries multiple parsing methods in order:                       │
│                                                                  │
│  1️⃣ extractAllProductsAggressive()                              │
│     • Scans ALL lines for product indicators                    │
│     • Looks for: serial numbers, brands, HSN, prices           │
│     • ✅ BEST for your 3-product bill                           │
│                                                                  │
│  2️⃣ parseNavaratnaVisualTable()                                 │
│     • Detects table structure                                   │
│     • Finds "Name of Item" header                              │
│     • Extracts products from table rows                        │
│                                                                  │
│  3️⃣ reconstructTableData()                                       │
│     • Handles fragmented OCR output                            │
│     • Groups multi-line product data                           │
│                                                                  │
│  4️⃣ parseNavaratnaLines()                                        │
│     • Line-by-line parsing                                     │
│     • Enhanced with new brand patterns                         │
│     • ✅ Handles complex product names                          │
│                                                                  │
│  Returns: Array of product objects                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Product Object Structure                            │
│  {                                                              │
│    name: "LED 43UR7550SLC ATR",                                │
│    companyName: "LG",                                          │
│    productId: "PID001",                                        │
│    serialNumber: "8528(21)",                                   │
│    hsn: "85281200",                                            │
│    qty: 1,                                                     │
│    quantity: 1,                                                │
│    stock: 1,                                                   │
│    price: 80000.00,                                            │
│    rate: 80000.00,                                             │
│    amount: 31250.00,                                           │
│    total: 31250.00,                                            │
│    gst: 18,                                                    │
│    unit: "No",                                                 │
│    tempId: "pdf-1234567890-0"                                  │
│  }                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AddCustomer.js                               │
│                  (Continued)                                    │
│  • Receives extractedData from parser                          │
│  • Processes products array (lines 98-139)                     │
│  • Sets tempProducts state                                     │
│  • Shows notification: "3 product(s) extracted!"               │
│  • Auto-fills customer form                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER SUBMITS FORM                            │
│  • Customer data saved to Firebase                             │
│  • Products saved to Firebase                                  │
│  • tempProducts passed to BillGenerator                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BillGenerator.js                             │
│  • Receives products array as prop                             │
│  • productsToUse = products (line 11)                          │
│  • Maps through array (line 217):                              │
│    productsToUse.map((p, idx) => <tr>...</tr>)                │
│  • Displays ALL products dynamically                           │
│  • Adds empty rows (line 236):                                 │
│    Array.from({ length: 6 - productsToUse.length })           │
│  • Calculates totals (line 13-25)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BILL DISPLAYED                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Sr. │ Company │ Serial │ Product Name │ Qty │ Price │ Amt│  │
│  ├─────┼─────────┼────────┼──────────────┼─────┼───────┼────┤  │
│  │  1  │   LG    │ 8528   │ LED 43UR...  │  1  │ 80000 │31250│ │
│  │  2  │Liebherr │ 8418   │ Ref FF TD... │  1  │ 50000 │32203│ │
│  │  3  │Atomberg │ 8509   │ Mixer Zen... │  1  │ 10000 │6779 │ │
│  │     │         │        │              │     │       │     │  │
│  │     │         │        │              │     │       │     │  │
│  │     │         │        │              │     │       │     │  │
│  └─────┴─────────┴────────┴──────────────┴─────┴───────┴────┘  │
│  Total: ₹70,233.05                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Parsing Strategy Details

### Strategy 1: Aggressive Extraction
```javascript
extractAllProductsAggressive(text, lines)
├── Scans ALL lines in the document
├── Checks for product indicators:
│   ├── hasSerialNumber: /^[1-9]\d?\s+/
│   ├── hasBrandName: /(lg|samsung|liebherr|atomberg|...)/i
│   ├── hasHSN: /\b\d{4,8}\b/
│   └── hasPrice: /[\d,]+\.\d{2}/
├── Extracts for each match:
│   ├── Serial number
│   ├── Company name (from brand list)
│   ├── Product name (text between company and HSN)
│   ├── HSN code
│   ├── Quantity (from "X No." pattern)
│   └── Price & Amount (last two numbers)
└── Returns: Array of products
```

### Strategy 2: Navaratna Lines Parser
```javascript
parseNavaratnaLines(lines)
├── Detects table start: /name\s+of\s+item.*qty.*rate/i
├── Detects table end: /^(total|gst\s+rate)/i
├── For each line in table:
│   ├── Check if starts with number: /^[1-9]\d?\s+/
│   ├── Extract company: /(lg|liebherr|atomberg|...)/i
│   ├── Extract product name:
│   │   └── Pattern: /^([A-Za-z0-9\s\-\/\(\)\']+?)(?:\s+\d{4,})/i
│   ├── Extract HSN: /\b(\d{6,8})\b/
│   ├── Extract quantity: /(\d+)\s*(?:nos?\.?|pcs?\.?)/i
│   └── Extract price & amount: last two numbers
└── Returns: Array of products
```

## 🎨 Component Hierarchy

```
App.js
└── AddCustomer.js
    ├── State Management
    │   ├── formData (customer info)
    │   ├── tempProducts (extracted products) ← KEY STATE
    │   ├── isUploadingBill (loading state)
    │   └── hasAutoFilledData (flag)
    │
    ├── Event Handlers
    │   ├── handleBillUpload() ← Calls pdfParser
    │   ├── handleSubmit() ← Saves to Firebase
    │   └── handleInputChange() ← Updates form
    │
    └── Child Components
        ├── AddProduct.js (add/edit products)
        ├── BillGenerator.js (display bill)
        │   └── Props: { customer, products, onBack }
        │       └── products = tempProducts ← DYNAMIC ARRAY
        └── Notification.js (show messages)
```

## 🔄 State Flow

```
Initial State:
tempProducts = []

After Upload:
tempProducts = [
  { name: "LED 43UR7550SLC ATR", companyName: "LG", ... },
  { name: "Ref FF TDPsg9 31Ti(18L J'steel)", companyName: "Liebherr", ... },
  { name: "Mixer Zenova BLDC 4J FG0473", companyName: "Atomberg", ... }
]

After Submit:
Products saved to Firebase → /products/{customerId}/{productId}

In BillGenerator:
productsToUse = props.products (3 items)
emptyRows = 6 - 3 = 3 rows
```

## 🧪 Testing Flow

```
1. Start App
   ↓
2. Navigate to Add Customer
   ↓
3. Upload Bill
   ↓
4. Check Console Logs:
   ✅ "🔍 Parsing Navaratna invoice lines..."
   ✅ "📋 Product table started at line X"
   ✅ "✅ Product 1 extracted: LG..."
   ✅ "✅ Product 2 extracted: Liebherr..."
   ✅ "✅ Product 3 extracted: Atomberg..."
   ✅ "📦 Navaratna parser extracted 3 products"
   ↓
5. Check UI:
   ✅ Notification: "3 product(s) extracted from bill!"
   ✅ Customer form auto-filled
   ✅ Products list shows 3 items
   ↓
6. Submit Form
   ↓
7. Generate Bill
   ↓
8. Verify Display:
   ✅ 3 product rows filled
   ✅ 3 empty rows added
   ✅ Total = 6 rows in table
   ✅ All product details correct
```

## 📦 Data Structures

### Customer Object
```javascript
{
  name: "Shamshuddin Bandar",
  phone: "8446420596",
  whatsapp: "8446420596",
  contactPerson: "Shamshuddin",
  address: "Guruwar Peth, Gavli Galli, Miraj",
  joinDate: "2025-10-07T04:11:23.000Z",
  productCount: 3
}
```

### Product Object (Full)
```javascript
{
  // Display names
  name: "LED 43UR7550SLC ATR",
  companyName: "LG",
  
  // Identifiers
  productId: "PID001",
  serialNo: "8528(21)",
  serialNumber: "8528(21)",
  hsn: "85281200",
  
  // Quantities (all same value)
  qty: 1,
  quantity: 1,
  stock: 1,
  
  // Prices (all same value)
  price: 80000.00,
  rate: 80000.00,
  amount: 31250.00,
  total: 31250.00,
  
  // Tax & Unit
  gst: 18,
  unit: "No",
  
  // Metadata
  tempId: "pdf-1234567890-0",
  isEditable: true,
  needsManualEntry: false
}
```

## 🎯 Key Functions

### pdfParser.js
```javascript
parsePdfToData(file)                    // Main entry point
├── extractTextFromPdf(file)            // PDF text extraction
├── extractTextFromImage(file)          // Image OCR
├── parseCustomerDetails(text)          // Extract customer
├── parseProductDetails(text)           // Extract products ← KEY
│   ├── extractAllProductsAggressive()
│   ├── parseNavaratnaVisualTable()
│   ├── reconstructTableData()
│   └── parseNavaratnaLines()
└── parseCompanyDetails(text)           // Extract company
```

### AddCustomer.js
```javascript
handleBillUpload(event)
├── Get file from input
├── Call parsePdfToData(file)
├── Process extractedData
│   ├── Update formData (customer)
│   └── Update tempProducts (products)
└── Show notification
```

### BillGenerator.js
```javascript
BillGenerator({ customer, products, onBack })
├── productsToUse = products
├── Calculate totals (useMemo)
├── Render bill
│   ├── Map products to rows
│   └── Add empty rows
└── Export functions (PDF, Print)
```

## 🚀 Performance Optimization

### Parsing Strategies (Ordered by Speed)
1. **Aggressive Extraction** - Fast, scans all lines
2. **Visual Table** - Medium, finds table structure
3. **Table Reconstruction** - Slow, groups fragmented data
4. **Line-by-Line** - Slowest, detailed parsing

### Caching
- Parsed data stored in component state
- No re-parsing on re-render
- Products cached in Firebase after submit

### Rendering
- Uses React.useMemo for totals calculation
- Maps products efficiently
- No unnecessary re-renders

## 📚 Further Reading

- `TESTING_GUIDE.md` - Detailed testing instructions
- `CHANGES_SUMMARY.md` - Quick reference of changes
- `src/utils/pdfParser.js` - Full parsing implementation
- `src/components/BillGenerator.js` - Display logic
- `src/components/AddCustomer.js` - Form handling
