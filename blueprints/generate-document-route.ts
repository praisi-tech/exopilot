// app/api/generate-document/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate & read request parameters
    const body = await req.json();
    const { buyerName, commodity, quantity, price } = body;

    // 2. Strict Input Validation
    if (!buyerName || typeof buyerName !== "string" || buyerName.trim() === "") {
      return NextResponse.json({ error: "buyerName is required." }, { status: 400 });
    }
    if (!commodity || typeof commodity !== "string" || commodity.trim() === "") {
      return NextResponse.json({ error: "commodity is required." }, { status: 400 });
    }
    if (!quantity || typeof quantity !== "string" || quantity.trim() === "") {
      return NextResponse.json({ error: "quantity is required." }, { status: 400 });
    }

    const priceOffer = price || "Negotiable FOB Indonesia Port";

    // 3. Double-check Server Security for Key Presence
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the host environment." },
        { status: 500 }
      );
    }

    // 4. Initialize the GoogleGenAI TypeScript client as modeled by Google AI Studio
    // Set the specific telemetry client header 'aistudio-build'
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = 
      "You are professional Indonesian Spice Export Director & Logistic Liaison officer. " +
      "You construct formal export sales contract offers, commercial pitch offers, or quotation sheets " +
      "conforming to International Chamber of Commerce Incoterms (Incoterms 2020) and standard maritime rules.";

    const promptMessage = `
Formulate an elegant, comprehensive "Formal Export Quotation Letter" in English, formatted in Markdown syntax, using these trade details:
- **Client Group/Importer:** ${buyerName}
- **Premium Spice Product:** ${commodity}
- **Shipment Volume / Weight:** ${quantity}
- **Agreed Quotation Trade Rate:** ${priceOffer}

The quotation letter MUST contain:
1. Contact Header: PTAgriland Spice Internasional, Export HQ Jakarta, Republic of Indonesia. Let the doc reference number look unique.
2. Formally addressed introduction mentioning shipping port selection (such as FOB Tanjung Priok, Surabaya, or Belawan port).
3. Primary Quote Table summarizing product description, exact grade (e.g. FAQ grade, Hand-Selected lal-pari, Whole or Split Cinnamon), bulk packing weights in metric tons, FOB rate, and the estimated contract valuation.
4. Logistics & Technical Parameters: Specifying strict quality standards (Moisture content <12.5%, Ash levels <3.2%, Foreign matter <1%, Volatile oils standard).
5. Standard Payment & Supply Terms: Payment via 100% Irrevocable Letter of Credit (L/C) at sight or 30% T/T Advance + 70% against documents. Quote remains valid for precisely 14 calendar days due to spice shipping cost volatility.
6. A professional greeting signature.

Ensure the output uses Markdown only (no additional wrapping text). Style it meticulously with clear tables, dividers, bold key phrases, and bullet points.
`;

    // 5. Query the recommended 'gemini-3.5-flash' model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    // 6. Extract and validate text response content
    const documentText = response.text;
    if (!documentText) {
      return NextResponse.json({ error: "Gemini failed to output document content." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: documentText,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Next.js Gemini Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + (error?.message || error) },
      { status: 500 }
    );
  }
}
