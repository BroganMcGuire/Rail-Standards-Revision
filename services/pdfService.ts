
import { UploadedStandard } from '../types';

declare const pdfjsLib: any;

export async function extractTextFromPDF(file: File): Promise<UploadedStandard> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfData = new Uint8Array(arrayBuffer);
  
  // Pass a slice to getDocument so the original pdfData buffer isn't detached
  const pdf = await pdfjsLib.getDocument({ data: pdfData.slice() }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += `\n[Page ${i}]\n` + strings.join(' ');
  }

  // Clean filename: remove (1), (2) identifiers
  const cleanName = file.name.replace(/\s*\(\d+\)\s*(?=\.pdf$)/i, '').replace(/\.pdf$/i, '');

  return {
    id: crypto.randomUUID(),
    name: cleanName,
    originalName: file.name,
    data: pdfData,
    text: fullText
  };
}
