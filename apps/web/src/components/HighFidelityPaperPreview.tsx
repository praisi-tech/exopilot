"use client";

import React from "react";
import { parseDocumentMetadata } from "./AIDocStudio";

interface HighFidelityPaperPreviewProps {
  docText: string;
  docType: string;
  businessName?: string;
  signatoryName?: string;
}

export function HighFidelityPaperPreview({ docText, docType, businessName, signatoryName }: HighFidelityPaperPreviewProps) {
  const parsed = parseDocumentMetadata(docText);
  const rawLines = parsed.bodyText.split("\n");
  
  const elements: React.ReactNode[] = [];
  let currentTableRows: { cells: string[]; isHeader: boolean }[] = [];
  
  const flushTable = (key: number) => {
    if (currentTableRows.length === 0) return;
    elements.push(
      <div key={`table-${key}`} className="my-4 overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            {currentTableRows.filter(r => r.isHeader).map((r, ri) => (
              <tr key={`th-${ri}`} className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-700 uppercase">
                {r.cells.map((cell, ci) => (
                  <th key={ci} className="px-3.5 py-2.5 first:pl-4 last:pr-4">{cell}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {currentTableRows.filter(r => !r.isHeader).map((r, ri) => (
              <tr key={`tr-${ri}`} className="border-b last:border-0 border-slate-100 text-[11px] text-slate-600 hover:bg-slate-50/30 transition-colors">
                {r.cells.map((cell, ci) => (
                  <td key={ci} className="px-3.5 py-2 first:pl-4 last:pr-4 font-mono font-medium">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTableRows = [];
  };

  let listItems: string[] = [];
  const flushList = (key: number) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`list-${key}`} className="space-y-1.5 my-3 pl-1">
        {listItems.map((item, idx) => {
          const parts = item.split(/\*\*([^*]+)\*\*/g);
          return (
            <li key={idx} className="flex gap-2 items-start text-[11px] text-slate-600 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600/80 mt-1.5 shrink-0" />
              <span>
                {parts.map((p, pidx) => (pidx % 2 === 1 ? <strong key={pidx} className="font-extrabold text-slate-900">{p}</strong> : p))}
              </span>
            </li>
          );
        })}
      </ul>
    );
    listItems = [];
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // If we were parsing a table and the current line is not table, flush the table
    if (!(trimmed.startsWith("|") && trimmed.endsWith("|")) && currentTableRows.length > 0) {
      flushTable(i);
    }

    // If we were parsing a list and current line is not a list, flush the list
    if (!(trimmed.startsWith("- ") || trimmed.startsWith("* ")) && listItems.length > 0) {
      flushList(i);
    }

    if (trimmed === "---") {
      elements.push(<hr key={i} className="border-t border-slate-200 my-4" />);
      continue;
    }

    if (trimmed === "") {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Headline #
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xs md:text-sm font-black text-slate-950 tracking-wide border-b border-indigo-150 pb-1.5 mb-3 mt-4 uppercase">
          {trimmed.substring(2).replace(/\*\*/g, "")}
        </h1>
      );
      continue;
    }

    // Headline ## or ###
    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      const startIdx = trimmed.startsWith("## ") ? 3 : 4;
      elements.push(
        <h2 key={i} className="text-[11px] font-black text-slate-900 tracking-tight mt-4 uppercase">
          {trimmed.substring(startIdx).replace(/\*\*/g, "")}
        </h2>
      );
      continue;
    }

    // Lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.substring(2));
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith(">")) {
      const content = trimmed.substring(1).trim().replace(/\*\*/g, "");
      elements.push(
        <div key={i} className="bg-indigo-50/50 border-l-2 border-indigo-500 p-2.5 rounded-r-xl italic text-slate-700 my-2 text-[10.5px] leading-relaxed">
          {content}
        </div>
      );
      continue;
    }

    // Table line
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (trimmed.includes("---") || trimmed.includes("-:-")) {
        continue;
      }
      const cells = trimmed
        .split("|")
        .map(c => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      let isHeader = false;
      if (i < rawLines.length - 1 && rawLines[i + 1].includes("---")) {
        isHeader = true;
      } else if (i > 0 && rawLines[i - 1].includes("---")) {
        isHeader = false;
      } else if (currentTableRows.length === 0) {
        isHeader = true;
      }

      currentTableRows.push({ cells, isHeader });
      continue;
    }

    // Default Paragraph line
    const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
    elements.push(
      <p key={i} className="text-slate-600 text-[11px] leading-relaxed">
        {parts.map((p, pidx) => (pidx % 2 === 1 ? <strong key={pidx} className="font-extrabold text-slate-900">{p}</strong> : p))}
      </p>
    );
  }

  // Flush any remaining tables/lists
  flushTable(rawLines.length);
  flushList(rawLines.length);

  return (
    <div className="bg-slate-100 p-2 sm:p-5 rounded-2xl flex justify-center items-center grow shadow-inner border border-slate-200 select-text overflow-hidden w-full">
      <div className="w-full bg-white shadow-md rounded-xl p-5 sm:p-8 relative border border-slate-200 overflow-hidden font-sans">
        
        {/* Quality Checked Watermark Stamp */}
        <div className="absolute right-6 top-20 sm:right-8 sm:top-24 opacity-[0.1] pointer-events-none select-none">
          <div className="border-2 border-dashed border-indigo-700 text-indigo-700 rounded-full w-20 h-20 p-1 flex flex-col items-center justify-center text-center rotate-12 font-black leading-tight">
            <span className="text-[7.5px] tracking-widest uppercase font-black">EXOPILOT</span>
            <div className="h-[0.5px] bg-indigo-700 w-full my-0.5" />
            <span className="text-[10px] font-extrabold uppercase">CO-OP</span>
            <span className="text-[7px] tracking-widest uppercase font-black">PASSED</span>
          </div>
        </div>

        {/* Business stationary header */}
        <div className="bg-slate-900 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 p-4 sm:p-5 mb-5 sm:mb-6 flex justify-between items-center text-white border-b border-indigo-950">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="bg-indigo-600 text-white text-[7.5px] font-black tracking-widest px-1.5 py-0.5 rounded leading-none uppercase">
                CO-OPS ARCHIVE
              </span>
              <span className="bg-emerald-500 text-white text-[7.5px] font-black tracking-widest px-1.5 py-0.5 rounded leading-none uppercase">
                VALIDATED
              </span>
            </div>
            <h2 className="text-[11px] font-black tracking-widest mt-1 uppercase text-slate-100 font-display">
              {businessName || "PT REMPAH NUSANTARA ABADI"}
            </h2>
            <p className="text-[8px] text-slate-400 mt-0.5">
              Exporter Co-Op Group • Tanjung Priok, Jakarta, Indonesia
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[7.5px] font-semibold text-slate-500 block uppercase tracking-widest">Document Registry</span>
            <span className="text-[9px] font-bold text-indigo-400 tracking-wider">
              {docType ? docType.toUpperCase() : "EXPORT FORMLET"}
            </span>
          </div>
        </div>

        {/* Document Title & Reference Panel */}
        <div className="mb-5 pb-4 border-b border-slate-100">
          <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase mb-3">
            {parsed.title || docType.toUpperCase()}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-[10px]">
            {/* Left: Exporter & Importer */}
            <div className="md:col-span-7 space-y-2">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[7.5px]">Exporter / Seller</span>
                <span className="text-slate-800 font-semibold">{parsed.exporter || businessName || "PT REMPAH NUSANTARA ABADI"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[7.5px]">Importer / Buyer</span>
                <span className="text-slate-800 font-semibold">{parsed.importer || "—"}</span>
              </div>
            </div>
            
            {/* Right: Key Details Panel */}
            <div className="md:col-span-5 bg-slate-50 rounded-xl p-3 border border-slate-150 grid grid-cols-2 gap-x-3 gap-y-2">
              <div className="col-span-2 border-b border-slate-200/60 pb-1 mb-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[7px]">Reference No.</span>
                <span className="text-slate-800 font-mono font-bold text-[10.5px]">{parsed.refNumber || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[7px]">Issue Date</span>
                <span className="text-slate-700 font-semibold">{parsed.issueDate || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[7px]">Validity / Expiry</span>
                <span className="text-slate-700 font-semibold">{parsed.expiryDate || "—"}</span>
              </div>
              {parsed.otherMetadata.map((m, idx) => (
                <div key={idx} className="col-span-2 border-t border-slate-200/40 pt-1 mt-1 flex justify-between gap-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] truncate">{m.key}</span>
                  <span className="text-slate-700 font-semibold text-right truncate max-w-[120px]">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parsed elements */}
        <div className="space-y-3 text-xs text-slate-700">
          {elements}
        </div>

        {/* Verified sign board */}
        <div className="grid grid-cols-2 gap-6 mt-8 border-t border-slate-100 pt-5 text-[9px]">
          <div>
            <p className="text-slate-400 uppercase tracking-wider font-bold">Verification Seal</p>
            <div className="mt-1.5 w-24 h-7 border border-dashed border-indigo-200 bg-indigo-50/10 rounded flex items-center justify-center font-bold text-[7.5px] text-indigo-500 uppercase tracking-widest select-none font-mono">
              EXOPILOT v1.1
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-slate-400 uppercase tracking-wider font-bold">Authorized Signatory</p>
            <div className="h-6 text-indigo-700 italic font-serif text-[13px] pr-2 mt-1.5 select-none leading-none flex items-end">
              {signatoryName || "Authorized Representative"}
            </div>
            <div className="h-[1px] w-24 bg-slate-300 my-0.5 font-sans" />
            <p className="text-[7.5px] text-slate-500 font-bold uppercase">{businessName || "PT REMPAH NUSANTARA ABADI"}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
