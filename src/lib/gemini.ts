import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function extractNIDData(base64Image: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        {
          text: "OCR this Smart NID card. Extract: name (English), nidNumber. Return as JSON."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          nidNumber: { type: Type.STRING }
        },
        required: ["name", "nidNumber"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function extractReceiptData(base64Image: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        {
          text: "Analyze this business receipt with precision. Extract:\n1. All line items with name, description, unit price, quantity, and total for that item.\n2. The total tax amount (if any).\n3. The grand total.\n4. Date of purchase.\n5. Vendor name.\nReturn strictly as JSON with the provided schema."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendor: { type: Type.STRING },
          date: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.STRING },
                price: { type: Type.NUMBER },
                itemTotal: { type: Type.NUMBER }
              }
            }
          },
          tax: { type: Type.NUMBER },
          total: { type: Type.NUMBER }
        },
        required: ["items", "total"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
