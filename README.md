# Receiving Verification System

**Stop inventory mistakes before they cost you money.**

A mobile-first web app that helps gas stations, convenience stores, and small businesses quickly verify deliveries against invoices. Catch shortages, overages, and discrepancies in real-time using AI-powered invoice scanning.

## The Problem This Solves

When suppliers deliver your order, you receive an invoice listing what they say they delivered. But mistakes happen:
- You ordered 10 cases, only 8 arrived
- Invoice says 50 items, you count 52 (billing error)
- Products are damaged during shipping
- Wrong items delivered

**Manually checking each item against a paper invoice is slow and error-prone. This app makes it fast and accurate.**

## How It Works

1. **Scan Invoice** → Take photo of delivery invoice with your phone
2. **AI Extracts Items** → Automatically pulls all line items, quantities, and prices
3. **Verify Physical Items** → Check off items as you count them
4. **Adjust Quantities** → Tap +/- buttons if counts don't match
5. **Flag Issues** → Mark items as Missing, Damaged, etc.
6. **Generate Report** → See exactly what matched and what didn't

**Result:** Verify deliveries in minutes instead of hours. Catch discrepancies while the driver is still there.

## Features

### 📱 Mobile-First Design
- Works on any smartphone browser (no app download needed)
- Large touch targets for busy hands/gloves
- Camera integration for quick scanning
- Responsive design works on tablets and desktops too

### 🤖 AI-Powered Invoice Scanning
- Uses Google Gemini Vision AI for OCR
- Extracts product names, quantities, and prices automatically
- Supports both PDF and image formats
- Handles multi-page invoices

### ✅ Interactive Verification Workflow
- One-tap verification for matching items
- +/- buttons for quick quantity adjustments
- Mark items as Missing, Damaged, Overage, etc.
- Add notes to individual items
- Color-coded status (Green = Match, Yellow = Discrepancy, Red = Missing)

### 📊 Reconciliation Reports
- Real-time summary of matches vs discrepancies
- Detailed breakdown of all issues
- Save reports with timestamps
- Track delivery history over time

### 💾 Optional Cloud Storage
- Firebase integration for saving reports
- Works offline - Firebase is optional
- View past delivery verifications
- Track supplier performance

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.0 Flash (Vision API for OCR and data extraction)
- **Database**: Firebase Firestore
- **Hosting**: Can be deployed to Vercel, Firebase Hosting, or any static host

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- A Google AI Studio API key ([Get one here](https://aistudio.google.com/apikey))
- A Firebase project ([Create one here](https://console.firebase.google.com/))

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Go to Project Settings > General
4. Under "Your apps", click the web icon (</>) to create a web app
5. Copy the Firebase configuration values
6. Go to Build > Firestore Database > Create Database (start in test mode for development)

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Edit the `.env.local` file with your API keys:

```env
# Get from https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Get from Firebase Console > Project Settings
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 5. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Daily Workflow: Receiving a Delivery

**When the supplier arrives:**

1. **Open the app** on your phone/tablet
2. Click **"Receive Delivery"**
3. **Take a photo** of the invoice (or upload PDF)
4. Click **"Extract Items"** - AI analyzes the invoice
5. **As you unload and count:**
   - Tap **"✓ Verify"** button for items that match
   - Use **+/- buttons** to adjust if quantity is different
   - Tap **"Missing"** for items not delivered
   - Tap **"Damaged"** for damaged goods
   - Add notes if needed (e.g., "Box was crushed")
6. Click **"Continue to Report"**
7. **Review the summary** - see matched vs problem items
8. Click **"Save Report"** to store the results

**Benefits:**
- Complete verification in 5-10 minutes
- Immediate feedback if something's wrong
- Documentation of every delivery
- Catch billing errors before they compound

### Tips for Best Results

**Photography:**
- Use good lighting
- Keep invoice flat and steady
- Make sure all text is visible
- For multi-page invoices, use PDF if possible

**Verification:**
- Verify items as you count to save time
- Use notes field for important details
- Check expiration dates during verification
- Save report even if everything matches (creates history)

## Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add your environment variables in the Vercel dashboard under Settings > Environment Variables.

### Deploy to Firebase Hosting
```bash
# Build the app
npm run build

# Install Firebase CLI
npm i -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## Firestore Security Rules

For production, update your Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for inventory (add authentication as needed)
    match /inventory/{itemId} {
      allow read, write: if true; // Replace with proper auth rules
    }

    match /invoices/{invoiceId} {
      allow read, write: if true; // Replace with proper auth rules
    }
  }
}
```

## Cost Considerations

- **Gemini API**: Free tier includes 1,500 requests per day
- **Firebase**: Free tier (Spark plan) includes:
  - 50K document reads/day
  - 20K document writes/day
  - 1GB storage

Perfect for small to medium businesses!

## Troubleshooting

**Image analysis fails:**
- Check that your Gemini API key is correct
- Ensure the image is clear and well-lit
- Try with a different photo

**Firebase errors:**
- Verify all Firebase config values in `.env.local`
- Make sure Firestore database is created
- Check browser console for specific error messages

**Items not saving:**
- Check Firestore security rules allow writes
- Verify Firebase project is set up correctly

## Roadmap

- [ ] Barcode scanning for faster item lookup
- [ ] Photo attachments for damaged items
- [ ] Voice input for hands-free quantity adjustments
- [ ] Export reports to PDF/Excel
- [ ] Email reports directly to suppliers
- [ ] Supplier performance tracking (on-time, accuracy ratings)
- [ ] Integration with POS systems
- [ ] Multi-user accounts with roles
- [ ] Offline mode with sync when online
- [ ] Push notifications for pending verifications

## License

MIT License - Free to use for your business!

## Contributing

Contributions welcome! If you have ideas for improvements or find bugs, please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

Have questions or issues? [Open an issue on GitHub](https://github.com/yourusername/receiving-verification-system/issues)

---

**Built for small business owners who are tired of inventory mistakes eating into their profits.**
