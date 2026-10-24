import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
export async function extractDocument(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Please choose a document smaller than 10 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'pdf' && extension !== 'docx') throw new Error('Choose a PDF or .docx Word document. For an older .doc file, save it as .docx first.');
  const buffer = await file.arrayBuffer();
  let text = '';
  if (extension === 'docx') {
    const { default: mammoth } = await import('mammoth/mammoth.browser.js');
    text = (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
  } else {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const task = pdfjs.getDocument({ data: buffer });
    // Password prompts are intentionally not part of this small import flow.
    task.onPassword = () => { void task.destroy(); };
    const pdf = await task.promise;
    try {
      if (pdf.numPages > 20) throw new Error('Please use a PDF of 20 pages or fewer, or paste the relevant paragraph.');
      const pages: string[] = [];
      let length = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
        length += pageText.length;
        if (length > 100000) throw new Error('This document contains too much text. Please paste just the relevant paragraph.');
        pages.push(pageText);
      }
      text = pages.join('\n\n');
    } finally { await task.destroy(); }
  }
  if (!text.trim()) throw new Error('No readable text was found. Scanned PDFs need OCR; please paste or type the relevant clause instead.');
  if (text.length > 100000) throw new Error('This document contains too much text. Please paste just the relevant paragraph.');
  return text.trim();
}
