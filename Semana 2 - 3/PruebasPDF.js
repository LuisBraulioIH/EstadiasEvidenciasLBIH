const fs = require('fs');
const PDFDocument = require('pdfkit');


const doc = new PDFDocument();


doc.pipe(fs.createWriteStream('Prueba.pdf'));

doc.fontSize(25).text('Texto pdf prueba', 100, 100);

doc.fontSize(14).text('Texto 2 de prueba', 100, 150);

doc.end();

console.log('PDF creado exitosamente como "documento.pdf".');
