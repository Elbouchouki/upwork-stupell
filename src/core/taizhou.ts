import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { TaizhouExtractor } from '@/types';

export const taizhouExtractor = async (file: File): Promise<TaizhouExtractor[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: TaizhouExtractor[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().includes("ITEM NO.Description")) {
        let po = (lines[--i].trim() as string).match(/PO: (\d+)/)?.[1]
        i++;
        i++;
        while (lines[i].trim().match(/^[A-Za-z]{2,4}\d{2,4}/)) {
          const match = (lines[i].trim() as string).replace(/,/, "").match(/([A-Z]+\d+)([^$]+)\$(\d+\.\d+)\$(\d+,?\d+\.\d+)/);
          if (match) {
            const [, part1, part2, part3, part4] = match;
            ross.push({
              Item: part1.slice(0, 'GCR111'.length),
              Description: (part1.slice('GCR111'.length) + part2.trim()).replace((Number(part4.replace(',', '')) / Number(part3)).toFixed(0), ""),
              Units: Number((Number(part4) / Number(part3)).toFixed(0)),
              Cost: Number(part3),
              "Extended Cost": Number(part4),
              PO: Number(po)
            })
          }
          i++;
        }
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
