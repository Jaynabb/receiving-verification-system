# How to Use Test Documents

I've created 3 realistic test documents for **ABC Electronics Store** - all products match so you can test the invoice matching feature properly!

## Test Documents

### 1. **inventory-list.html** - Professional Inventory List
- Clean, formatted table with 12 products
- Includes SKUs, quantities, prices, categories
- **Use this FIRST** to populate your inventory

### 2. **invoice-sample.html** - Supplier Invoice
- Professional invoice from TechSupply Co.
- 7 line items that **MATCH** products from the inventory list
- Items like "Wireless Gaming Mouse", "Mechanical Keyboard", etc.
- **Use this SECOND** to test auto-matching

### 3. **handwritten-style.html** - Handwritten Stock Count
- Same products as the inventory list
- Simpler, handwritten-style format
- Shows the AI can handle different document styles
- **Alternative to #1** - test with different formats

## 🎯 Perfect Test Sequence

### Step 1: Scan Inventory (Use inventory-list.html)
1. Open `inventory-list.html` in browser
2. Screenshot it
3. Go to app → "📸 Scan Inventory"
4. Upload screenshot
5. Click "Analyze Image"
6. **Expected:** Extracts all 12 products with SKUs, prices, quantities
7. Click "Save to Inventory"

### Step 2: Match Invoice (Use invoice-sample.html)
1. Open `invoice-sample.html` in browser
2. Screenshot it
3. Go to app → "📋 Match Invoice"
4. Upload screenshot
5. Click "Analyze & Match"
6. **Expected:** All 7 invoice items match to existing inventory! 🎉
   - Wireless Gaming Mouse → MATCHED
   - Mechanical Keyboard → MATCHED
   - USB-C Hub → MATCHED
   - Webcam → MATCHED
   - Headset → MATCHED
   - Wireless Charging Pad → MATCHED
   - Bluetooth Speaker → MATCHED

### Step 3: Test Different Format (Use handwritten-style.html)
1. Clear your inventory or use a different browser session
2. Screenshot `handwritten-style.html`
3. Upload to "Scan Inventory"
4. **Expected:** Same products extracted, different format handled perfectly

## Matching Products Across Documents

These products appear in ALL documents:

| Product | Inventory List | Invoice | Handwritten |
|---------|---------------|---------|-------------|
| Wireless Gaming Mouse | ✅ | ✅ | ✅ |
| Mechanical Keyboard RGB | ✅ | ✅ | ✅ |
| USB-C Hub 7-Port | ✅ | ✅ | ✅ |
| 1080p Webcam | ✅ | ✅ | ✅ |
| Noise-Canceling Headset | ✅ | ✅ | ✅ |
| Wireless Charging Pad | ✅ | ✅ | ✅ |
| Bluetooth Speaker | ✅ | ✅ | ✅ |

Plus 5 more products in the inventory list only.

## How to Screenshot on Mobile

**Easiest Method:**
1. Open any `.html` file on your **phone's browser**
2. Take a screenshot right there
3. Upload directly to the app

**iPhone:**
- Side Button + Volume Up

**Android:**
- Power Button + Volume Down

**Or from Computer:**
1. Open HTML in browser
2. Windows: `Windows + Shift + S`
3. Mac: `Cmd + Shift + 4`
4. Save and transfer to phone

## Expected Results

### Inventory Scan Should Extract:
- ✅ Product names
- ✅ Quantities (45 pcs, 32 units, etc.)
- ✅ Prices ($29.99, $79.99, etc.)
- ✅ SKUs (LT-2024-A1, KB-5589-X, etc.)
- ✅ Categories (Peripherals, Audio, etc.)

### Invoice Match Should Show:
- ✅ All line items extracted
- ✅ Quantities and prices
- ✅ **Green "MATCHED" badges** for items found in inventory
- ✅ Match count: "7 matched to existing inventory"

## Testing on Mobile Browser

1. Make sure you're on the same WiFi as your computer
2. Go to: `http://192.168.4.30:3000`
3. The app is fully mobile-optimized!
4. Camera upload works directly from the upload button

## Tips for Best Results

1. ✅ Screenshot with good resolution
2. ✅ Make sure all text is readable
3. ✅ Keep document straight (not tilted)
4. ✅ Use good lighting if photographing a printed version
5. ✅ The AI handles different formats - try them all!

## What Makes This Test Perfect

- **Consistent Products**: All documents use the same product catalog
- **Real Matching**: Invoice items actually exist in inventory
- **Different Formats**: Tests table, invoice, and handwritten styles
- **Complete Data**: Has all fields (SKU, price, quantity, category)

Have fun testing the automatic matching! 🚀
