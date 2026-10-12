const PDFDocument = require('pdfkit');
const { marked } = require('marked');

function plainText(value) {
  return String(value ?? '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .trim();
}

function renderNotesPdf({ topic, note, response }) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 58, bottom: 58, left: 54, right: 54 }, bufferPages: true, info: { Title: `${topic.name} - Aptitude Notes`, Author: 'ExamForge' } });
  doc.pipe(response);
  doc.font('Helvetica-Bold').fontSize(23).fillColor('#172b4d').text(topic.name, { align: 'left' });
  doc.moveDown(0.35);
  doc.font('Helvetica').fontSize(10).fillColor('#53647c').text(`Preparation difficulty: ${topic.difficulty}  |  ${topic.category_name}`);
  doc.moveDown(1.2);

  const tokens = marked.lexer(note.content, { gfm: true });
  const writeParagraph = (text, size = 10, color = '#34445d') => {
    const content = plainText(text);
    if (!content) return;
    doc.font('Helvetica').fontSize(size).fillColor(color).text(content, { width: 487, lineGap: 3, paragraphGap: 5 });
    doc.moveDown(0.35);
  };

  for (const token of tokens) {
    if (token.type === 'heading') {
      const sizes = { 1: 19, 2: 15, 3: 12 };
      doc.moveDown(token.depth === 1 ? 0.8 : 0.5);
      doc.font('Helvetica-Bold').fontSize(sizes[token.depth] || 11).fillColor('#19365f').text(plainText(token.text), { width: 487 });
      doc.moveDown(0.25);
    } else if (token.type === 'paragraph') {
      writeParagraph(token.text);
    } else if (token.type === 'list') {
      for (const [index, item] of token.items.entries()) {
        const marker = token.ordered ? `${index + 1}.` : '•';
        const itemText = item.tokens?.map((part) => part.text || part.raw || '').join(' ') || item.text;
        doc.font('Helvetica').fontSize(10).fillColor('#34445d').text(`${marker}  ${plainText(itemText)}`, { width: 470, indent: 8, lineGap: 2, paragraphGap: 3 });
      }
      doc.moveDown(0.35);
    } else if (token.type === 'table') {
      const tableRows = [token.header, ...token.rows].map((row) => row.map((cell) => plainText(cell.text)));
      const columnCount = Math.max(...tableRows.map((row) => row.length));
      const columnWidth = 487 / Math.max(columnCount, 1);
      for (const [rowIndex, row] of tableRows.entries()) {
        const text = row.map((cell, index) => `${index ? ' | ' : ''}${cell}`).join('');
        doc.font(rowIndex === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor(rowIndex === 0 ? '#19365f' : '#34445d')
          .text(text, { width: 487, lineGap: 2, paragraphGap: 2 });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.4);
      void columnWidth;
    } else if (token.type === 'blockquote') {
      writeParagraph(token.text, 10, '#53647c');
    } else if (token.type === 'code') {
      writeParagraph(token.text, 9, '#30415e');
    } else if (token.type === 'hr') {
      doc.moveDown(0.4).moveTo(54, doc.y).lineTo(541, doc.y).strokeColor('#d8e0eb').stroke().moveDown(0.4);
    }
  }

  const pages = doc.bufferedPageRange();
  for (let index = pages.start; index < pages.start + pages.count; index += 1) {
    doc.switchToPage(index);
    doc.font('Helvetica').fontSize(8).fillColor('#78869b')
      .text('ExamForge | Aptitude Preparation', 54, 25, { width: 487, align: 'left', lineBreak: false });
    doc.text(`Page ${index + 1} of ${pages.count}`, 54, 805, { width: 487, align: 'right', lineBreak: false });
  }
  doc.end();
  return doc;
}

module.exports = { renderNotesPdf };
