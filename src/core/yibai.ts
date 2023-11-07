import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { YibaiSCExtractor } from '@/types';

export const yibaiExtractor = async (file: File): Promise<YibaiSCExtractor[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: YibaiSCExtractor[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n');
    const pattern = /CNM(\d+[A-Z])(\d+x\d+)\s(.*?)\s(\d+)\s(\$\d+\.\d{2})(US\$\d{1,3}(,\d{3})*\.\d{2})/;
    fs.writeFile("yebe.txt", lines.join("\n"))
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].trim().match(pattern);
      if (match) {
        const [, itemNo, size, description, quantity, unitPrice, totalAmount] = match;
        console.log(`${itemNo}\t${size} ${description}\t${quantity}\t${unitPrice}\t${totalAmount}`);
      } else if (lines[i].trim() === "MDF BAR WITH WOOD VENEER（KY-S1）A2") {
        console.log(` ${lines[i].trim()}`);
      } else if (lines[i].trim().match(/^\d+\.\d+\s\d+\.\d+\s\d+\.\d+\s\d+\.\d+\s\d+/)) {
        console.log(` ${lines[i].trim()}`);
      } else if (lines[i].trim().match(/^\d+\$\d+\.\d{2}US\$\d+,\d+\.\d{2}/)) {
        console.log(` ${lines[i].trim()}`);
      }
    }
  })

  try {
    await pdfParser.loadPDF(tempFilePath)
  } catch (e) {
    console.log(e);
  }

  await new Promise((resolve) => {
    pdfParser.on('pdfParser_dataReady', () => {
      resolve(null);
    });
  });

  if (ross.length === 0) throw new Error("No data found in PDF file");

  return ross.filter((item) => !!item)
}
