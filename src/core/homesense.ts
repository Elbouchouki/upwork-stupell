import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { HomeSenseExtractor } from '@/types';

export const homeSenseExtractor = async (file: File): Promise<HomeSenseExtractor[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: HomeSenseExtractor[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  function formatDate(day: string, month: string, year: string): string {
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${day}-${monthNames.indexOf(month) + 1}-${year}`;
  }

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n');
    const pos: Set<number> = new Set()
    fs.writeFile("HomeSense2.txt", lines.join("\n"))
    for (let i = 0; i < lines.length; i++) {
      if ((lines[i].trim() as string).toUpperCase().includes("IMPORT PO NUMBER:")) {
        let po = (lines[i].trim() as string).toUpperCase().replace("IMPORT PO NUMBER:", "").trim()
        console.log(po)
        while (!(lines[i].trim() as string).toUpperCase().includes("FREIGHT FORWARDER BYPAYMENT TERMSPAYMENT TYPE")) i++;
        i++;
        const datex = ((lines[i].trim() as string).match(/[A-Z]{3}-(\d{2})-(\d{4})/g)?.[2] as string).split("-")
        const cancelDate = formatDate(datex[1], datex[0], datex[2])
        while (i < lines.length && !(lines[i].trim() as string).toUpperCase().includes("IMPORT PO NUMBER:")) {
          const pattern = /\d+\.\d+[A-Z]+\d+[A-Z]+ ?\d+X\d+ [A-Z0-9 /]+(\d+)/;
          const match = (lines[i].trim() as string).match(pattern);
          if (match) {
            console.log((lines[i].trim() as string));
            // console.log("------->", match[0]);
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
