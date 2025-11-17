import { GoogleGenerativeAI } from '@google/generative-ai';
import type { InventoryItem, InvoiceItem } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export async function analyzeInventoryPhoto(base64Image: string): Promise<InventoryItem[]> {
  // Validate inputs
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  if (!base64Image || base64Image.length === 0) {
    throw new Error('No image data provided. Please upload a valid image.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are analyzing a photo of an inventory list or product shelf/storage.
Extract ALL products/items visible in the image with their details.

For each item, extract:
- name: Product name
- description: Brief description if visible
- quantity: Number of units (if visible, otherwise estimate or use 0)
- unit: Unit of measurement (pcs, boxes, kg, etc.)
- price: Price if visible (optional)
- sku: SKU/product code if visible (optional)
- category: Product category (optional)

Return ONLY a valid JSON array of objects with this structure:
[
  {
    "name": "Product Name",
    "description": "description here",
    "quantity": 10,
    "unit": "pcs",
    "price": 25.99,
    "sku": "ABC123",
    "category": "Electronics"
  }
]

Important:
- Extract ALL items you can see
- If quantity is not visible, use 1 as default
- Be accurate with product names
- If unsure about a field, omit it
- Return ONLY the JSON array, no markdown formatting`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Remove markdown code blocks if present
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const items: InventoryItem[] = JSON.parse(cleanedText);

    // Add IDs and timestamps
    return items.map(item => ({
      ...item,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  } catch (error: any) {
    console.error('Error analyzing inventory photo:', error);

    // Provide more specific error messages
    if (error?.message?.includes('API_KEY')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration.');
    }
    if (error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    if (error?.message?.includes('SAFETY')) {
      throw new Error('Image was blocked by safety filters. Please try a different image.');
    }
    if (error?.name === 'SyntaxError' || error?.message?.includes('JSON')) {
      throw new Error('AI returned invalid response. Please try again.');
    }

    // Log the full error for debugging
    console.error('Full error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });

    throw new Error(`Analysis failed: ${error?.message || 'Unknown error'}. Check browser console for details.`);
  }
}

export async function analyzeInvoicePhoto(base64Image: string, inventoryItems: InventoryItem[]): Promise<InvoiceItem[]> {
  // Validate inputs
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  if (!base64Image || base64Image.length === 0) {
    throw new Error('No image data provided. Please upload a valid image.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const inventoryList = inventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku
    }));

    const prompt = `You are analyzing an invoice/receipt photo.
Extract all line items from this invoice.

Here is the user's current inventory for matching:
${JSON.stringify(inventoryList, null, 2)}

For each invoice item, extract:
- name: Item name as shown on invoice
- quantity: Quantity ordered
- unitPrice: Price per unit (optional)
- total: Total price for this item (optional)
- matchedInventoryId: If this item matches any inventory item, include the inventory ID

Return ONLY a valid JSON object with this structure:
{
  "vendorName": "Vendor Name",
  "invoiceNumber": "INV-12345",
  "date": "2025-11-15",
  "total": 150.00,
  "items": [
    {
      "name": "Item Name",
      "quantity": 5,
      "unitPrice": 10.00,
      "total": 50.00,
      "matchedInventoryId": "abc123"
    }
  ]
}

Important:
- Try to match invoice items to inventory items by name similarity
- If you find a match, include the matchedInventoryId
- Extract vendor name, invoice number, and date if visible
- Return ONLY the JSON object, no markdown formatting`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Remove markdown code blocks if present
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const invoiceData = JSON.parse(cleanedText);

    return invoiceData.items || [];
  } catch (error: any) {
    console.error('Error analyzing invoice photo:', error);

    // Provide more specific error messages
    if (error?.message?.includes('API_KEY')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration.');
    }
    if (error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    if (error?.message?.includes('SAFETY')) {
      throw new Error('Image was blocked by safety filters. Please try a different image.');
    }
    if (error?.name === 'SyntaxError' || error?.message?.includes('JSON')) {
      throw new Error('AI returned invalid response. Please try again.');
    }

    // Log the full error for debugging
    console.error('Full error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });

    throw new Error(`Analysis failed: ${error?.message || 'Unknown error'}. Check browser console for details.`);
  }
}
