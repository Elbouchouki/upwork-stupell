import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { RossExtractorData } from '@/types';

export const rossExtractor = async (file: File): Promise<RossExtractorData[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: RossExtractorData[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i++].trim().includes("VENDOR INSTRUCTIONSPURCHASE ORDER NO")) {
        let po = lines[i++].trim();
        let j = i;
        let count = 0;
        while (!lines[j].trim().includes("PO CANCEL DATE")) j++;
        let date = lines[++j].trim().slice(8);

        while (!lines[i].trim().includes("NESTED PK QTY")) i++;
        while (lines[i].trim().includes("NESTED PK QTY")) {
          count++;
          i++;
        }
        let r: RossExtractorData[] = new Array(count);
        for (let j = 0; j < count; j++) {
          ross.push({
            Item: lines[i + j].trim(),
            Description: lines[i + j + (count * 1)].trim(),
            Cost: Number(lines[i + j + (count * 2)].trim()),
            Units: Number(lines[i + j + (count * 5)].trim()),
            "Pcs Per Nest": Number(lines[i + j + (count * 7)].trim()),
            Nest: lines[i + j + (count * 8)].trim().split(" ")[1],
            PO: Number(po),
            "Cancel Date": date
          })
        }
        ross.push(...r)
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
