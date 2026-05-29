"use client";

import React, { useState } from "react";
import { FileText, Cpu, Download, Sparkles, Printer, Loader2 } from "lucide-react";
import * as api from "@/lib/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsPDF } from "jspdf";
import { HighFidelityPaperPreview } from "./HighFidelityPaperPreview";
import { useLanguage } from "@/lib/LanguageContext";

export function cleanAIDocument(text: string): string {
  let cleaned = text.trim();
  
  // 1. Remove markdown code block wrappers if the model wrapped the entire response
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.substring(11).trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3).trim();
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  
  // 2. Search for the first header (H1, H2 or H3) starting with "#"
  const h1Index = cleaned.indexOf("#");
  if (h1Index !== -1 && h1Index > 0) {
    const preamble = cleaned.substring(0, h1Index).trim();
    const preambleLower = preamble.toLowerCase();
    const conversationalKeywords = ["exopilot", "expert", "generate", "here is", "sure", "as a", "i have", "dear", "hello", "professional", "specification"];
    const isConversational = conversationalKeywords.some(keyword => preambleLower.includes(keyword)) || preamble.length < 400;
    
    if (isConversational) {
      cleaned = cleaned.substring(h1Index).trim();
    }
  }
  
  // 3. Remove conversational postamble if any
  const lines = cleaned.split("\n");
  let lastValuableLineIndex = lines.length - 1;
  while (lastValuableLineIndex >= 0) {
    const lineTrim = lines[lastValuableLineIndex].trim();
    if (lineTrim === "") {
      lastValuableLineIndex--;
      continue;
    }
    const lineLower = lineTrim.toLowerCase();
    if (lineLower.startsWith("if you need") || 
        lineLower.startsWith("hope this helps") || 
        lineLower.startsWith("let me know if") || 
        lineLower.includes("exopilot ai") || 
        lineLower.startsWith("best regards") ||
        lineLower.startsWith("here is the") ||
        (lineLower.length < 100 && (lineLower.includes("thank you") || lineLower.includes("regards")))) {
      lastValuableLineIndex--;
    } else {
      break;
    }
  }
  
  if (lastValuableLineIndex < lines.length - 1) {
    cleaned = lines.slice(0, lastValuableLineIndex + 1).join("\n").trim();
  }
  
  return cleaned;
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export interface ParsedDoc {
  title: string;
  exporter: string;
  importer: string;
  refNumber: string;
  issueDate: string;
  expiryDate: string;
  otherMetadata: Array<{ key: string; value: string }>;
  bodyText: string;
}

export function parseDocumentMetadata(text: string): ParsedDoc {
  const lines = text.split("\n");
  let title = "";
  let exporter = "";
  let importer = "";
  let refNumber = "";
  let issueDate = "";
  let expiryDate = "";
  const otherMetadata: Array<{ key: string; value: string }> = [];
  
  let bodyStartIndex = 0;
  let parsedMetadataCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") {
      continue;
    }
    
    // If we see H1, record title
    if (line.startsWith("# ")) {
      title = line.substring(2).replace(/\*\*/g, "").trim();
      continue;
    }
    
    // Check if it is a metadata line: starts with bold text "**Key:** Value" or "**Key**: Value" or "Key: Value"
    const metadataMatch = line.match(/^\*\*(.*?)\*\*:\s*(.*)$/) || line.match(/^(.*?):\s*(.*)$/);
    if (metadataMatch) {
      const rawKey = metadataMatch[1].replace(/\*\*/g, "").trim();
      const value = metadataMatch[2].replace(/\*\*/g, "").trim();
      const keyLower = rawKey.toLowerCase();
      
      if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("|") || line.startsWith(">")) {
        bodyStartIndex = i;
        break;
      }
      
      if (keyLower.includes("exporter") || keyLower.includes("seller")) {
        exporter = value;
      } else if (keyLower.includes("importer") || keyLower.includes("buyer")) {
        importer = value;
      } else if (keyLower.includes("ref") || keyLower.includes("reference") || keyLower.includes("invoice number") || keyLower.includes("contract number") || keyLower.includes("invoice no")) {
        refNumber = value;
      } else if (keyLower.includes("issue date") || (keyLower.includes("date") && !keyLower.includes("expiry") && !keyLower.includes("expiration") && !keyLower.includes("validity"))) {
        issueDate = value;
      } else if (keyLower.includes("expiry") || keyLower.includes("expiration") || keyLower.includes("valid") || keyLower.includes("validity")) {
        expiryDate = value;
      } else if (rawKey.length < 30 && value.length < 150) {
        otherMetadata.push({ key: rawKey, value });
      } else {
        bodyStartIndex = i;
        break;
      }
      parsedMetadataCount++;
      continue;
    }
    
    // If we reach a section header, horizontal rule, list, or table, we stop parsing metadata
    if (line.startsWith("##") || line.startsWith("---") || line.startsWith("|") || line.startsWith("-") || line.startsWith("*")) {
      bodyStartIndex = i;
      break;
    }
    
    if (parsedMetadataCount > 0) {
      bodyStartIndex = i;
      break;
    }
  }
  
  const bodyText = lines.slice(bodyStartIndex).join("\n").trim();
  
  return {
    title,
    exporter,
    importer,
    refNumber,
    issueDate,
    expiryDate,
    otherMetadata,
    bodyText
  };
}

interface AIDocStudioProps {
  inquiries: any[];
  currentUser?: { name: string; email: string; businessName: string } | null;
  onAlert: (msg: string, type: "success" | "error") => void;
}

export function AIDocStudio({ inquiries, currentUser, onAlert }: AIDocStudioProps) {
  const { t, language, isRtl } = useLanguage();
  const [docType, setDocType] = useState("Quotation");
  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [formData, setFormData] = useState({ buyerName: "", commodity: "Nutmeg (ABCD Grade)", quantity: "15 MT", price: "$8,500/MT", destinationCountry: "Germany", negotiationNotes: "" });
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [loading, setLoading] = useState(false);

  const getDocTypeLabel = (dt: string) => {
    if (dt === "Quotation") return language === "en" ? "Quotation" : language === "hi" ? "कोटेशन" : language === "zh" ? "报价单" : language === "ar" ? "عرض سعر" : "Penawaran";
    if (dt === "Invoice") return language === "en" ? "Invoice" : language === "hi" ? "चालान" : language === "zh" ? "发票" : language === "ar" ? "فاتورة" : "Invoice";
    return language === "en" ? "Contract" : language === "hi" ? "अनुबंध" : language === "zh" ? "合同" : language === "ar" ? "عقد" : "Kontrak";
  };

  const handleInquiryChange = (id: string) => {
    setSelectedInquiryId(id);
    const found = inquiries.find((i) => i.id === id);
    if (found) {
      setFormData({
        buyerName: found.buyerName,
        commodity: found.product,
        quantity: found.quantity,
        price: found.price || "$8,000/MT",
        destinationCountry: found.country,
        negotiationNotes: found.negotiationNotes || "",
      });
    }
  };

  const handleGenerate = async () => {
    if (!formData.buyerName || !formData.commodity) {
      onAlert(
        language === "en" ? "Buyer name and commodity are required to compile documents." :
        language === "hi" ? "दस्तावेज़ संकलित करने के लिए खरीदार का नाम और वस्तु आवश्यक है।" :
        language === "zh" ? "必须填写买家名称和商品才能编译单证。" :
        language === "ar" ? "اسم المشتري والسلعة مطلوبان لتجميع المستندات." :
        "Nama buyer dan komoditas diperlukan untuk menyusun dokumen.",
        "error"
      );
      return;
    }
    setLoading(true);

    const myBusinessName = currentUser?.businessName || "PT Rempah Nusantara Abadi";
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const systemPrompt = `You are Exopilot AI, a world-class international trade documentation expert.
Generate a professional, fully-detailed, realistic export ${docType} document for:
- Exporter/Seller: ${myBusinessName} (Tanjung Priok, Jakarta, Indonesia)
- Buyer/Importer: ${formData.buyerName} (Destination: ${formData.destinationCountry})
- Product: ${formData.commodity}
- Volume/Quantity: ${formData.quantity}
- Target Price: ${formData.price}
- Custom Demands/Negotiation Notes: ${formData.negotiationNotes || "None"}

Requirements:
1. Format output as clean, valid Markdown. Do not include raw HTML.
2. The document MUST NOT look like an AI-generated text template. Do NOT include any conversational preamble, intro text, greeting, or postamble. The document must start directly with the markdown H1 title of the document.
3. To make it look highly authentic and professional, use a clean structured text layout for the document header:
   - The document H1 title should be standard: e.g. "# EXPORT QUOTATION" or "# COMMERCIAL INVOICE" or "# INTERNATIONAL SALES CONTRACT".
   - Below the title, add a beautifully organized metadata block listing key transaction details: Exporter / Seller entity, Importer / Buyer entity, Document Reference Number, Issue Date, and Expiration / Validity Date.
4. Use professional corporate language and legal-standard headings.
5. Include an international transaction reference number (e.g. INV-2026-XXXX or RNA-EX-XXXX).
6. Organize the details using clean markdown tables for items, quantities, and prices.
7. Under separate sections, detail:
   - Port of Loading (Tanjung Priok, Jakarta, Indonesia)
   - Port of Discharge / Destination Port (based on country)
   - Standard Trade Terms (Incoterms: FOB or CIF as preferred by buyer notes)
   - Quality Specifications (moisture content, packaging)
   - Payment Terms (e.g. 30% advance, 70% against BL or Letter of Credit)
8. Address any specific custom demands from the negotiation notes (e.g., specific moisture level, delivery request).
9. Strictly DO NOT hallucinate, fabricate, or make up transaction details (such as bank account numbers, SWIFT codes, container numbers, seal numbers, exact freight costs, or shipping lines) unless they are explicitly provided. If any details are not specified, leave them blank (e.g., using "[ _____________________ ]") so that the user can fill them in.
10. Conclude with signature sections and official agricultural liaison declaration.`;

        const candidateModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"];
        let result = null;
        let lastError = null;

        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(systemPrompt);
            if (result) {
              console.log(`Successfully generated document using model: ${modelName}`);
              break;
            }
          } catch (modelErr) {
            console.warn(`Model ${modelName} failed or not found, trying fallback...`, modelErr);
            lastError = modelErr;
          }
        }

        if (!result) {
          throw lastError || new Error("All candidate Gemini models failed.");
        }

        const text = result.response.text();
        const cleanedText = cleanAIDocument(text);
        setGeneratedDoc(cleanedText);
        
        onAlert(
          language === "en" ? "Export document compiled dynamically via Gemini AI!" :
          language === "hi" ? "निर्यात दस्तावेज़ जेमिनी एआई के माध्यम से गतिशील रूप से संकलित किया गया!" :
          language === "zh" ? "已通过 Gemini AI 动态编译出口单证！" :
          language === "ar" ? "تم تجميع مستند التصدير ديناميكيًا عبر جيميناي إيه آي!" :
          "Dokumen ekspor berhasil disusun secara dinamis menggunakan Gemini AI!",
          "success"
        );
        setLoading(false);
        return;
      } catch (err) {
        console.error("Gemini compilation failed, falling back to backend api...", err);
      }
    }

    // Backend Fallback
    try {
      const res = await api.generateDocument({
        docType,
        businessName: myBusinessName,
        ...formData,
      });
      const cleaned = cleanAIDocument(res.document);
      setGeneratedDoc(cleaned);
      onAlert(
        language === "en" ? "Export document draft compiled successfully!" :
        language === "hi" ? "निर्यात दस्तावेज़ का मसौदा सफलतापूर्वक संकलित किया गया!" :
        language === "zh" ? "出口单证草稿编译成功！" :
        language === "ar" ? "تم تجميع مسودة مستند التصدير بنجاح!" :
        "Draf dokumen ekspor berhasil disusun!",
        "success"
      );
    } catch {
      onAlert(
        language === "en" ? "Generation failed." :
        language === "hi" ? "उत्पादन विफल रहा।" :
        language === "zh" ? "生成失败。" :
        language === "ar" ? "فشل الإنشاء." :
        "Penyusunan gagal.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!generatedDoc) return;
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const parsed = parseDocumentMetadata(generatedDoc);
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      const companyNameUpper = (currentUser?.businessName || "PT REMPAH NUSANTARA ABADI").toUpperCase();

      const checkPage = (need: number) => {
        if (y + need > pageH - 20) {
          doc.addPage();
          // Running Header on new pages
          doc.setFillColor(79, 70, 229); // indigo-600 top strip
          doc.rect(0, 0, pageW, 2.5, "F");
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`${companyNameUpper}  |  ${docType.toUpperCase()}`, margin, 8);
          doc.text("EXOPILOT SECURE REGISTRY", pageW - margin, 8, { align: "right" });
          
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.15);
          doc.line(margin, 10, pageW - margin, 10);
          y = 15;
        }
      };

      // ── Sleek Premium Letterhead Header ──
      // Top indigo accent strip
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 0, pageW, 3, "F");
      
      // Company name (dark corporate slate)
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(companyNameUpper, margin, 12);
      
      // Exporter/Subtitle details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Exporter Co-Op Group  |  Tanjung Priok, Jakarta, Indonesia  |  info@exopilot.co", margin, 16.5);
      
      // Badge-style Document Type Tag
      doc.setFillColor(243, 244, 246); // gray-100
      doc.rect(pageW - margin - 40, 8, 40, 5, "F");
      doc.setDrawColor(209, 213, 219); // gray-300
      doc.setLineWidth(0.15);
      doc.rect(pageW - margin - 40, 8, 40, 5);
      
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(docType.toUpperCase(), pageW - margin - 20, 11.5, { align: "center" });
      
      // Document Registry metadata
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("EXOPILOT SECURE REGISTRY", pageW - margin, 16.5, { align: "right" });

      // Clean divider line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(margin, 21, pageW - margin, 21);

      y = 28;

      // ── Side-by-Side Corporate Metadata Panel ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("EXPORTER / SELLER", margin, y);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42); // slate-900
      const expText = parsed.exporter || companyNameUpper;
      const expLines = doc.splitTextToSize(expText, contentW * 0.5 - 5);
      doc.text(expLines, margin, y + 4.5);
      
      const buyerY = y + 4.5 + expLines.length * 3.5 + 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("IMPORTER / BUYER", margin, buyerY);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42); // slate-900
      const impText = parsed.importer || formData.buyerName || "—";
      const impLines = doc.splitTextToSize(impText, contentW * 0.5 - 5);
      doc.text(impLines, margin, buyerY + 4.5);

      // Metadata Panel (Right side)
      const boxX = margin + contentW * 0.5 + 3;
      const boxW = contentW * 0.5 - 3;
      const boxH = 26;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(boxX, y - 2, boxW, boxH, "F");
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.rect(boxX, y - 2, boxW, boxH);
      
      let boxY = y + 2.5;
      // Ref No
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text("REFERENCE NO.", boxX + 4, boxY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(parsed.refNumber || "—", boxX + 4, boxY + 4.5);
      
      // Issue Date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text("ISSUE DATE", boxX + boxW * 0.5 + 2, boxY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(parsed.issueDate || todayStr(), boxX + boxW * 0.5 + 2, boxY + 4.5);
      
      // Expiry Date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text("VALIDITY / EXPIRY", boxX + 4, boxY + 11.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(parsed.expiryDate || "—", boxX + 4, boxY + 16);
      
      // Other Metadata if any
      if (parsed.otherMetadata.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(parsed.otherMetadata[0].key.toUpperCase(), boxX + boxW * 0.5 + 2, boxY + 11.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(parsed.otherMetadata[0].value, boxX + boxW * 0.5 + 2, boxY + 16);
      }

      y = Math.max(buyerY + 4.5 + impLines.length * 3.5 + 5, y - 2 + boxH + 5);
      
      // Clean divider line below the panel
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      // ── Parse markdown content ──
      const rawLines = parsed.bodyText.split("\n");
      let inTable = false;
      const tableRows: string[][] = [];

      const drawTable = (rows: string[][]) => {
        if (rows.length === 0) return;
        
        // Calculate dynamic column widths based on content size
        const colCount = rows[0].length;
        const colWidths: number[] = new Array(colCount).fill(0);
        
        // Measure character length in each cell to calculate relative weights
        const colWeights = new Array(colCount).fill(0);
        for (let ri = 0; ri < rows.length; ri++) {
          for (let ci = 0; ci < colCount; ci++) {
            const cellText = (rows[ri][ci] || "").trim();
            colWeights[ci] = Math.max(colWeights[ci], cellText.length);
          }
        }
        
        // Enforce minimum weight to prevent squished columns
        for (let ci = 0; ci < colCount; ci++) {
          colWeights[ci] = Math.max(colWeights[ci], 6);
        }
        
        const totalWeight = colWeights.reduce((a, b) => a + b, 0);
        
        // Allocate proportional column widths
        for (let ci = 0; ci < colCount; ci++) {
          colWidths[ci] = (colWeights[ci] / totalWeight) * contentW;
          if (colWidths[ci] < 18) colWidths[ci] = 18; // minimum width in mm
        }
        
        // Re-normalize to equal exactly contentW
        const currentSum = colWidths.reduce((a, b) => a + b, 0);
        for (let ci = 0; ci < colCount; ci++) {
          colWidths[ci] = (colWidths[ci] / currentSum) * contentW;
        }

        const padding = 2.5; // mm horizontal cell padding
        const cellTextPaddingY = 4.2; // vertical padding for baseline text placement
        const minRowHeight = 8;
        
        // Row drawing helper
        const drawRow = (rowCells: string[], isHeaderRow: boolean, bgFillColor?: [number, number, number]) => {
          // Perform wrap logic using splitTextToSize
          const wrappedCells = rowCells.map((cellText, ci) => {
            const cleanText = (cellText || "").trim();
            const cellW = colWidths[ci] - padding * 2;
            return doc.splitTextToSize(cleanText, cellW > 4 ? cellW : 14);
          });
          
          // Row height proportional to the maximum wrapped lines
          const maxLines = Math.max(...wrappedCells.map(lines => lines.length), 1);
          const rowHeight = Math.max(minRowHeight, maxLines * 3.5 + 3.8);
          
          checkPage(rowHeight);
          
          // Fill background if specified
          if (bgFillColor) {
            doc.setFillColor(bgFillColor[0], bgFillColor[1], bgFillColor[2]);
            doc.rect(margin, y, contentW, rowHeight, "F");
          }
          
          let xOff = margin;
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.15);
          
          for (let ci = 0; ci < colCount; ci++) {
            // Cell outline rectangle
            doc.rect(xOff, y, colWidths[ci], rowHeight);
            
            doc.setFont("helvetica", isHeaderRow ? "bold" : "normal");
            doc.setFontSize(isHeaderRow ? 7 : 7.5);
            doc.setTextColor(isHeaderRow ? 15 : 51, isHeaderRow ? 23 : 65, isHeaderRow ? 42 : 85);
            
            const lines = wrappedCells[ci];
            lines.forEach((line: string, lineIdx: number) => {
              doc.text(line, xOff + padding, y + cellTextPaddingY + (lineIdx * 3.5));
            });
            
            xOff += colWidths[ci];
          }
          
          y += rowHeight;
        };
        
        // Draw Header
        drawRow(rows[0], true, [241, 245, 249]);
        
        // Draw Data
        for (let ri = 1; ri < rows.length; ri++) {
          const bg: [number, number, number] | undefined = (ri % 2 === 0) ? [248, 250, 252] : undefined;
          drawRow(rows[ri], false, bg);
        }
        y += 4;
      };

      for (let i = 0; i < rawLines.length; i++) {
        const trimmed = rawLines[i].trim();

        // Table boundary
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          if (!inTable) { inTable = true; tableRows.length = 0; }
          if (trimmed.includes("---") || trimmed.includes("-:-")) continue;
          const cells = trimmed.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableRows.push(cells);
          continue;
        } else if (inTable) {
          drawTable(tableRows);
          inTable = false;
        }

        // Empty line
        if (trimmed === "") { y += 3; continue; }

        // Horizontal rule
        if (trimmed === "---") {
          checkPage(2);
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y, pageW - margin, y);
          y += 5;
          continue;
        }

        // H1
        if (trimmed.startsWith("# ")) {
          checkPage(10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          const text = trimmed.substring(2).replace(/\*\*/g, "");
          doc.text(text.toUpperCase(), margin, y + 5);
          y += 6;
          doc.setDrawColor(199, 210, 254);
          doc.line(margin, y, margin + 40, y);
          y += 6;
          continue;
        }

        // H2 / H3
        if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
          checkPage(8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          const offset = trimmed.startsWith("## ") ? 3 : 4;
          doc.text(trimmed.substring(offset).replace(/\*\*/g, "").toUpperCase(), margin, y + 4);
          y += 8;
          continue;
        }

        // List item
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          checkPage(6);
          doc.setFillColor(79, 70, 229);
          doc.circle(margin + 1.5, y + 1.5, 0.8, "F");
          doc.setFontSize(7.5);
          const listIndent = margin + 5;
          const listContentW = contentW - 5;
          const listParts = trimmed.substring(2).split(/\*\*([^*]+)\*\*/g);
          const listSegs: { text: string; bold: boolean }[] = listParts.map((p, pi) => ({
            text: p, bold: pi % 2 === 1,
          })).filter(s => s.text !== "");
          let listLineBuffer: { text: string; bold: boolean }[] = [];
          let listLineWidth = 0;
          const flushListLine = (isLast: boolean) => {
            if (listLineBuffer.length === 0) return;
            let lxOff = listIndent;
            listLineBuffer.forEach(seg => {
              doc.setFont("helvetica", seg.bold ? "bold" : "normal");
              doc.setTextColor(seg.bold ? 15 : 51, seg.bold ? 23 : 65, seg.bold ? 42 : 85);
              doc.text(seg.text, lxOff, y + 3.5);
              lxOff += doc.getTextWidth(seg.text);
            });
            if (!isLast) { y += 4.5; checkPage(4.5); }
            listLineBuffer = []; listLineWidth = 0;
          };
          for (const seg of listSegs) {
            const words = seg.text.split(/(\s+)/);
            let carry = "";
            for (const word of words) {
              doc.setFont("helvetica", seg.bold ? "bold" : "normal");
              const ww = doc.getTextWidth(carry + word);
              if (listLineWidth + ww > listContentW && listLineWidth > 0) {
                if (carry) listLineBuffer.push({ text: carry, bold: seg.bold });
                carry = "";
                flushListLine(false);
              }
              carry += word;
              listLineWidth += doc.getTextWidth(word);
            }
            if (carry) listLineBuffer.push({ text: carry, bold: seg.bold });
          }
          flushListLine(true);
          y += 6;
          continue;
        }

        // Blockquote
        if (trimmed.startsWith(">")) {
          checkPage(8);
          doc.setFillColor(238, 242, 255);
          doc.rect(margin, y - 1, contentW, 7, "F");
          doc.setDrawColor(99, 102, 241);
          doc.setLineWidth(0.8);
          doc.line(margin, y - 1, margin, y + 6);
          doc.setLineWidth(0.2);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          doc.text(trimmed.substring(1).trim().replace(/\*\*/g, ""), margin + 3, y + 4);
          y += 10;
          continue;
        }

        // Paragraph with bold — full-width word-wrap with inline bold support
        checkPage(6);
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        // Build segments: [{text, bold}]
        const rawParts = trimmed.split(/\*\*([^*]+)\*\*/g);
        const segments: { text: string; bold: boolean }[] = rawParts.map((p, pi) => ({
          text: p,
          bold: pi % 2 === 1,
        })).filter(s => s.text !== "");

        // Greedy word-wrap: accumulate words until line overflows, then flush
        const lineHeight = 4.5;
        let lineBuffer: { text: string; bold: boolean }[] = [];
        let lineWidth = 0;

        const flushLine = (isLast: boolean) => {
          if (lineBuffer.length === 0) return;
          let xOff = margin;
          lineBuffer.forEach(seg => {
            doc.setFont("helvetica", seg.bold ? "bold" : "normal");
            doc.setTextColor(seg.bold ? 15 : 51, seg.bold ? 23 : 65, seg.bold ? 42 : 85);
            doc.text(seg.text, xOff, y + lineHeight);
            xOff += doc.getTextWidth(seg.text);
          });
          if (!isLast) { y += lineHeight; checkPage(lineHeight); }
          lineBuffer = [];
          lineWidth = 0;
        };

        for (const seg of segments) {
          const words = seg.text.split(/(\s+)/);
          let carry = "";
          for (const word of words) {
            doc.setFont("helvetica", seg.bold ? "bold" : "normal");
            const ww = doc.getTextWidth(carry + word);
            if (lineWidth + ww > contentW && lineWidth > 0) {
              // Flush current line, start new
              if (carry) lineBuffer.push({ text: carry, bold: seg.bold });
              carry = "";
              flushLine(false);
            }
            carry += word;
            lineWidth += doc.getTextWidth(word);
          }
          if (carry) {
            lineBuffer.push({ text: carry, bold: seg.bold });
          }
        }
        flushLine(true);
        y += 7;
      }

      // Flush remaining table
      if (inTable) { drawTable(tableRows); }

      // ── Footer ──
      checkPage(20);
      y += 5;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text("Verification Seal", margin, y);
      doc.text("Authorized Signatory", pageW - margin, y, { align: "right" });
      y += 2;
      doc.setFillColor(238, 242, 255);
      doc.rect(margin, y, 30, 6, "F");
      doc.setDrawColor(199, 210, 254);
      doc.rect(margin, y, 30, 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(99, 102, 241);
      doc.text("EXOPILOT v1.1", margin + 15, y + 4, { align: "center" });
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text(currentUser?.name || "Authorized Representative", pageW - margin, y + 4, { align: "right" });
      y += 5;
      doc.setDrawColor(203, 213, 225);
      doc.line(pageW - margin - 35, y, pageW - margin, y);
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text(companyNameUpper, pageW - margin, y + 2, { align: "right" });

      doc.save(`${docType.toLowerCase().replace(/\s+/g, "_")}_${formData.buyerName.toLowerCase().replace(/\s+/g, "_")}.pdf`);
      onAlert(
        language === "en" ? "PDF successfully generated and downloaded!" :
        language === "hi" ? "PDF successfully generated and downloaded!" :
        language === "zh" ? "PDF 已成功生成并下载！" :
        language === "ar" ? "تم إنشاء ملف PDF وتنزيله بنجاح!" :
        "PDF berhasil dibuat dan diunduh!",
        "success"
      );
    } catch (e) {
      console.error(e);
      onAlert(
        language === "en" ? "PDF export failed." :
        language === "hi" ? "PDF export failed." :
        language === "zh" ? "导出 PDF 失败。" :
        language === "ar" ? "فشل تصدير PDF." :
        "Ekspor PDF gagal.",
        "error"
      );
    }
  };

  const handleExportWord = () => {
    if (!generatedDoc) return;
    try {
      const companyName = currentUser?.businessName || "PT Rempah Nusantara Abadi";
      const parsed = parseDocumentMetadata(generatedDoc);
      const rawLines = parsed.bodyText.split("\n");
      let htmlBody = "";
      let inTable = false;
      let tableRows: string[][] = [];

      const drawTableHtml = (rows: string[][]) => {
        if (rows.length === 0) return "";
        let tHtml = '<table style="width:100%; border-collapse:collapse; margin:20px 0; font-family:\'Segoe UI\', Arial, sans-serif; table-layout: auto; word-wrap: break-word;">';
        // Header row - professional dark slate background
        tHtml += '<tr style="background-color:#0f172a; font-weight:bold; color:#ffffff;">';
        rows[0].forEach(cell => {
          tHtml += `<th style="border:1px solid #cbd5e1; padding:10px 12px; text-align:left; font-size:10pt; color:#ffffff; font-weight:bold;">${cell.trim()}</th>`;
        });
        tHtml += '</tr>';
        // Data rows
        for (let ri = 1; ri < rows.length; ri++) {
          const bg = ri % 2 === 0 ? "#f8fafc" : "#ffffff";
          tHtml += `<tr style="background-color:${bg};">`;
          rows[ri].forEach(cell => {
            const val = cell ? cell.trim() : "";
            tHtml += `<td style="border:1px solid #cbd5e1; padding:10px 12px; text-align:left; font-size:10pt; color:#334155;">${val}</td>`;
          });
          tHtml += '</tr>';
        }
        tHtml += '</table>';
        return tHtml;
      };

      for (let i = 0; i < rawLines.length; i++) {
        const trimmed = rawLines[i].trim();

        // Table boundary
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          if (!inTable) { inTable = true; tableRows = []; }
          if (trimmed.includes("---") || trimmed.includes("-:-")) continue;
          const cells = trimmed.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableRows.push(cells);
          continue;
        } else if (inTable) {
          htmlBody += drawTableHtml(tableRows);
          inTable = false;
        }

        if (trimmed === "") {
          htmlBody += '<p style="margin-bottom:10px; font-size:11pt; color:#334155; line-height:1.5;">&nbsp;</p>';
          continue;
        }

        if (trimmed === "---") {
          htmlBody += '<hr style="border:none; border-top:1px solid #e2e8f0; margin:15px 0;"/>';
          continue;
        }

        if (trimmed.startsWith("# ")) {
          const text = trimmed.substring(2).replace(/\*\*/g, "").toUpperCase();
          htmlBody += `<h1 style="font-size:15pt; color:#0f172a; border-bottom:2px solid #6366f1; padding-bottom:5px; margin-top:20px; margin-bottom:10px; text-transform:uppercase;">${text}</h1>`;
          continue;
        }

        if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
          const offset = trimmed.startsWith("## ") ? 3 : 4;
          const text = trimmed.substring(offset).replace(/\*\*/g, "").toUpperCase();
          htmlBody += `<h2 style="font-size:12pt; color:#1e293b; margin-top:15px; margin-bottom:8px; text-transform:uppercase;">${text}</h2>`;
          continue;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          let text = trimmed.substring(2);
          const boldRegex = /\*\*([^*]+)\*\*/g;
          text = text.replace(boldRegex, '<b>$1</b>');
          htmlBody += `<li style="margin-bottom:5px; font-size:11pt; color:#334155; line-height:1.5;">${text}</li>`;
          continue;
        }

        if (trimmed.startsWith(">")) {
          let text = trimmed.substring(1).trim();
          const boldRegex = /\*\*([^*]+)\*\*/g;
          text = text.replace(boldRegex, '<b>$1</b>');
          htmlBody += `<div style="background-color:#f5f3ff; border-left:4px solid #6366f1; padding:10px; margin:15px 0; font-style:italic; color:#4f46e5;">${text}</div>`;
          continue;
        }

        // Paragraph line
        let formattedText = trimmed;
        const boldRegex = /\*\*([^*]+)\*\*/g;
        formattedText = formattedText.replace(boldRegex, '<b>$1</b>');

        htmlBody += `<p style="margin-bottom:10px; font-size:11pt; color:#334155; line-height:1.5;">${formattedText}</p>`;
      }

      if (inTable) {
        htmlBody += drawTableHtml(tableRows);
      }

      const fullWordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${docType}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21cm 29.7cm;
            margin: 2.5cm 2.5cm 2.5cm 2.5cm;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #334155;
          }
        </style>
      </head>
      <body>
        <!-- Sleek Premium Letterhead Header -->
        <div style="border-top: 4px solid #4f46e5; padding-top: 15px; margin-bottom: 25px; font-family:'Segoe UI', Arial, sans-serif;">
          <table style="width:100%; border:none; margin:0; border-collapse:collapse;">
            <tr style="border:none; background:none;">
              <td style="border:none; padding:0; text-align:left; background:none;">
                <h2 style="color:#0f172a; margin:0; font-size:15pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">${companyName}</h2>
                <p style="color:#64748b; margin:4px 0 0 0; font-size:8.5pt;">Exporter Co-Op Group | Tanjung Priok, Jakarta, Indonesia | info@exopilot.co</p>
              </td>
              <td style="border:none; padding:0; text-align:right; vertical-align:middle; background:none;">
                <div style="background-color:#f3f4f6; border:1px solid #d1d5db; padding:4px 10px; display:inline-block; font-weight:bold; color:#4f46e5; font-size:9.5pt; text-transform:uppercase; letter-spacing:0.5px;">
                  ${docType.toUpperCase()}
                </div>
                <p style="color:#94a3b8; margin:4px 0 0 0; font-size:7.5pt; text-transform:uppercase; letter-spacing:0.5px;">EXOPILOT SECURE REGISTRY</p>
              </td>
            </tr>
          </table>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin-top:12px; margin-bottom:0;" />
        </div>

        <!-- Document Title & Reference Panel -->
        <h1 style="font-size:14pt; color:#0f172a; border-bottom:2px solid #6366f1; padding-bottom:5px; margin-top:0px; margin-bottom:15px; text-transform:uppercase;">
          ${parsed.title || docType.toUpperCase()}
        </h1>

        <table style="width:100%; border:none; margin-bottom:25px; border-collapse:collapse; font-family:'Segoe UI', Arial, sans-serif;">
          <tr style="border:none; background:none;">
            <!-- Left Side: Addresses -->
            <td style="border:none; width:55%; padding:0; vertical-align:top; background:none; text-align:left;">
              <div style="margin-bottom:12px;">
                <span style="color:#94a3b8; font-weight:bold; text-transform:uppercase; font-size:8pt; display:block; letter-spacing:0.5px;">Exporter / Seller</span>
                <span style="color:#0f172a; font-weight:bold; font-size:10pt; display:block; margin-top:3px;">${parsed.exporter || companyName}</span>
              </div>
              <div>
                <span style="color:#94a3b8; font-weight:bold; text-transform:uppercase; font-size:8pt; display:block; letter-spacing:0.5px;">Importer / Buyer</span>
                <span style="color:#0f172a; font-weight:bold; font-size:10pt; display:block; margin-top:3px;">${parsed.importer || formData.buyerName || '—'}</span>
              </div>
            </td>
            <!-- Right Side: Key Reference Box -->
            <td style="border:none; width:45%; padding:0; vertical-align:top; background:none; text-align:right;">
              <div style="display:inline-block; width:100%; background-color:#f8fafc; border:1px solid #e2e8f0; padding:12px; text-align:left;">
                <div style="margin-bottom:8px; border-bottom:1px solid #cbd5e1; padding-bottom:4px;">
                  <span style="color:#94a3b8; font-weight:bold; text-transform:uppercase; font-size:7.5pt; display:block;">Reference No.</span>
                  <span style="color:#0f172a; font-weight:bold; font-size:9pt; font-family:monospace; display:block; margin-top:2px;">${parsed.refNumber || '—'}</span>
                </div>
                <table style="width:100%; border:none; border-collapse:collapse; background:none;">
                  <tr style="border:none; background:none;">
                    <td style="border:none; padding:0; background:none; width:50%; text-align:left; vertical-align:top;">
                      <span style="color:#94a3b8; font-weight:bold; text-transform:uppercase; font-size:7.5pt; display:block;">Issue Date</span>
                      <span style="color:#334155; font-weight:bold; font-size:9pt; display:block; margin-top:2px;">${parsed.issueDate || todayStr()}</span>
                    </td>
                    <td style="border:none; padding:0; background:none; width:50%; text-align:left; vertical-align:top;">
                      <span style="color:#94a3b8; font-weight:bold; text-transform:uppercase; font-size:7.5pt; display:block;">Validity / Expiry</span>
                      <span style="color:#334155; font-weight:bold; font-size:9pt; display:block; margin-top:2px;">${parsed.expiryDate || '—'}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
        <hr style="border:none; border-top:1px solid #e2e8f0; margin-bottom:20px; margin-top:10px;" />

        <!-- Document Body -->
        <div style="font-family:'Segoe UI', Arial, sans-serif;">
          ${htmlBody}
        </div>

        <!-- Verification Seal and Sign Board -->
        <table style="width:100%; margin-top:50px; border:none; border-top:1px solid #e2e8f0; font-family:'Segoe UI', Arial, sans-serif;">
          <tr style="border:none; background:none;">
            <td style="border:none; width:50%; text-align:left; font-size:9pt; color:#64748b; padding-top:15px; background:none;">
              <p style="margin:0 0 5px 0; font-weight:bold; text-transform:uppercase; font-size:8pt; color:#94a3b8;">Verification Seal</p>
              <div style="border:1px dashed #c7d2fe; background-color:#eef2ff; color:#6366f1; font-weight:bold; font-size:8pt; padding:6px 12px; display:inline-block; font-family:monospace;">
                EXOPILOT v1.1
              </div>
            </td>
            <td style="border:none; width:50%; text-align:right; font-size:9pt; color:#64748b; padding-top:15px; background:none;">
              <p style="margin:0 0 5px 0; font-weight:bold; text-transform:uppercase; font-size:8pt; color:#94a3b8;">Authorized Signatory</p>
              <p style="margin:0 0 2px 0; font-family:Georgia, serif; font-style:italic; font-size:14pt; color:#4f46e5;">${currentUser?.name || "Authorized Representative"}</p>
              <p style="margin:0; font-weight:bold; text-transform:uppercase; font-size:8pt; color:#64748b;">${companyName.toUpperCase()}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

      const blob = new Blob(['\ufeff' + fullWordHtml], {
        type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docType.toLowerCase().replace(/\s+/g, "_")}_${formData.buyerName.toLowerCase().replace(/\s+/g, "_")}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onAlert(
        language === "en" ? "Word document successfully generated and downloaded!" :
        "Dokumen Word berhasil dibuat dan diunduh!",
        "success"
      );
    } catch (e) {
      console.error(e);
      onAlert(
        language === "en" ? "Word export failed." :
        "Ekspor Word gagal.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{t("docStudio", "title")}</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">{t("docStudio", "subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-150 card-shadow space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {language === "en" ? "Document Blueprint" :
               language === "hi" ? "दस्तावेज़ खाका" :
               language === "zh" ? "文档蓝图" :
               language === "ar" ? "مخطط المستند" :
               "Cetak Biru Dokumen"}
            </h3>
            <p className="text-[9px] text-slate-400">
              {language === "en" ? "Configure parameters for automated generation" :
               language === "hi" ? "स्वचालित उत्पादन के लिए पैरामीटर कॉन्फ़िगर करें" :
               language === "zh" ? "配置自动生成的参数" :
               language === "ar" ? "تكوين معلمات التوليد الآلي" :
               "Konfigurasi parameter untuk pembuatan otomatis"}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("docStudio", "selectTemplate")}</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-150 rounded-xl p-1 text-[10px] font-bold">
              {["Quotation", "Invoice", "Contract"].map((typeVal) => (
                <button
                  key={typeVal}
                  onClick={() => setDocType(typeVal)}
                  className={`py-2 rounded-lg cursor-pointer transition-all ${docType === typeVal ? "bg-white text-indigo-600 shadow-sm border border-slate-150" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {getDocTypeLabel(typeVal)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("docStudio", "selectInquiry")}</label>
            <select
              value={selectedInquiryId}
              onChange={(e) => handleInquiryChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 text-xs bg-white focus:outline-none cursor-pointer"
            >
              <option value="">
                {language === "en" ? "-- Choose Logged Buyer Inquiry (Optional) --" :
                 language === "hi" ? "-- लॉग किए गए खरीदार पूछताछ चुनें (वैकल्पिक) --" :
                 language === "zh" ? "-- 选择已登记的买家询盘 (可选) --" :
                 language === "ar" ? "-- اختر استفسار المشتري المسجل (اختياري) --" :
                 "-- Pilih Permintaan Buyer Terdaftar (Opsional) --"}
              </option>
              {inquiries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.buyerName} ({i.product})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3.5 border-t border-slate-100 pt-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {language === "en" ? "Buyer Entity Name" :
                 language === "hi" ? "खरीदार इकाई का नाम" :
                 language === "zh" ? "买家实体名称" :
                 language === "ar" ? "اسم كيان المشتري" :
                 "Nama Entitas Buyer"}
              </label>
              <input required placeholder="e.g. Klausen Spice GmbH" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Product" :
                   language === "hi" ? "उत्पाद" :
                   language === "zh" ? "产品" :
                   language === "ar" ? "المنتج" :
                   "Produk"}
                </label>
                <input required placeholder="e.g. Nutmeg (ABCD)" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={formData.commodity} onChange={(e) => setFormData({ ...formData, commodity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Cargo Volume" :
                   language === "hi" ? "कार्गो मात्रा" :
                   language === "zh" ? "货物数量" :
                   language === "ar" ? "حجم الشحنة" :
                   "Volume Muatan"}
                </label>
                <input required placeholder="e.g. 15 MT" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Target FOB Price (MT)" :
                   language === "hi" ? "लक्षित एफओबी मूल्य (मीट्रिक टन)" :
                   language === "zh" ? "目标 FOB 价格 (吨)" :
                   language === "ar" ? "سعر FOB المستهدف (طن متري)" :
                   "Harga Target FOB (MT)"}
                </label>
                <input required placeholder="e.g. $8,500/MT" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {language === "en" ? "Destination Country" :
                   language === "hi" ? "गंतव्य देश" :
                   language === "zh" ? "目的国" :
                   language === "ar" ? "بلد الوجهة" :
                   "Negara Tujuan"}
                </label>
                <input required placeholder="e.g. Germany" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800" value={formData.destinationCountry} onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t("docStudio", "instructions")}</label>
              <textarea placeholder="e.g. Wants CIF Rotterdam delivery instead of FOB. LC opened via MUFG Bank. Request moisture level <12%." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20 resize-none text-slate-800" value={formData.negotiationNotes} onChange={(e) => setFormData({ ...formData, negotiationNotes: e.target.value })} />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            id="btn-generate-doc"
            className="w-full py-3 bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
            {loading ? t("docStudio", "generating") : t("docStudio", "generateBtn")}
          </button>
        </div>

        {/* Right Preview panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-150 card-shadow min-h-[460px] flex flex-col justify-between">
            {generatedDoc ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      {language === "en" ? `${getDocTypeLabel(docType)} Draft Compiled` :
                       language === "hi" ? `${getDocTypeLabel(docType)} का मसौदा संकलित` :
                       language === "zh" ? `${getDocTypeLabel(docType)} 草稿已编译` :
                       language === "ar" ? `تم تجميع مسودة ${getDocTypeLabel(docType)}` :
                       `Draf ${getDocTypeLabel(docType)} Disusun`}
                    </span>
                    <span className="flex items-center gap-1 text-[8px] bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold px-2 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-200" /> Gemini AI
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportPDF}
                      id="btn-pdf-export"
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-xl text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> {t("docStudio", "downloadPdf")}
                    </button>
                    <button
                      onClick={handleExportWord}
                      id="btn-word-export"
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-850 text-indigo-700 rounded-xl text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-500" /> {language === "en" ? "Download Word" : "Unduh Word"}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Document Body */}
                <div className="flex-1 overflow-y-auto max-h-[420px]">
                  <HighFidelityPaperPreview docText={generatedDoc} docType={docType} businessName={currentUser?.businessName || "PT REMPAH NUSANTARA ABADI"} signatoryName={currentUser?.name || "Authorized Representative"} />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Cpu className="w-10 h-10 text-indigo-100 animate-pulse mb-3" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {language === "en" ? "Trade Compiler Idle" :
                   language === "hi" ? "व्यापार संकलक निष्क्रिय" :
                   language === "zh" ? "单证编译器空闲" :
                   language === "ar" ? "مجمع التجارة خامل" :
                   "Kompilator Dokumen Idle"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
                  {t("docStudio", "placeholder")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
