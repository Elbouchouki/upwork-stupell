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
    let lines = (pdfParser as any).getRawTextContent()
    lines = lines.replace("Total Price  ($US)", "\n")
    lines = lines.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().match(/PO: (\d+)/)) {
        let po = lines[i].trim().match(/PO: (\d+)/)?.[1]
        i++;
        while (!(lines[i].trim() as string).toLocaleLowerCase().startsWith("Total".toLocaleLowerCase())) {
          const match = (lines[i].trim() as string).replace(/,/, "").match(/\b[A-Za-z\d]+\$[0-9]+\.\d{2}\$[0-9]+\.\d{2}\b/g);
          if (match) {
            const l = (lines[i].trim() as string).replace(/-/g, "").replace(/,/g, "")
            const splitted = l.split(" ")
            const regex = /\b([A-Za-z\d]+)\$([0-9]+\.\d{2})\$([0-9]+\.\d{2})\b/;
            const match = splitted[splitted.length - 1].match(regex);
            const [, text, cost, total, _] = match!;
            ross.push({
              Item: l.slice(0, 'GCR111'.length),
              Description: splitted[0].slice('GCR111'.length) + " " + splitted.slice(1, splitted.length - 2).join(" "),
              Units: Number((Number(total) / Number(cost)).toFixed(0)),
              Cost: Number(cost),
              "Extended Cost": Number(total),
              PO: Number(po)
            })
          }
          i++
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
