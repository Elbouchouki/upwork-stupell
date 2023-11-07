
import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { AtHomeExtractor } from '@/types';

export const atHomeExtractor = async (file: File): Promise<AtHomeExtractor[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: AtHomeExtractor[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  function extractSubstring(inputString: string): string | null {
    const match = inputString.match(/[A-Z]+[0-9]+[A-Z]?[0-9]?[X0-9]+/i);
    return match ? match[0] : null;
  }

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n');
    let pos = new Set<number>()
    // fs.writeFile("athome.txt", lines.join("\n"))
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().includes("PO Number")) {
        let po = (lines[i].trim() as string).replace("PO Number", "").trim()
        if (pos.has(Number(po))) continue
        pos.add(Number(po))
        while (!lines[i].trim().includes("Do Not Ship After")) i++
        let cancelDate = lines[i].trim().replace("Do Not Ship After", "").trim()
        let fob = lines[++i].trim().replace("FOB Point", "").trim()
        while (!lines[i].trim().includes("Packaging Information")) {
          const regexPattern = /EA\d+\.\d+\.\d+\.\d+/;
          const line = lines[i].trim().replace(/,/g, '')
          const match = line.trim().match(regexPattern);
          let price = 0
          let extendedPrice = 0
          let units = ""
          if (match) {
            const splited = line.split("EA")
            const regex = /\d+\.\d{2}/g;
            const matches = splited[1].match(regex);
            if (matches) {
              extendedPrice = Number(matches[2])
              price = Number(matches[1])
              units = (extendedPrice / price).toFixed(0)
            }
            const ss: string[] = splited[0].split(" ")
            let description = ss[0].slice(10) + " " + ss.filter((item, index) => index !== 0 && index !== ss.length - 1).join(" ")
            const d = ss[ss.length - 1]
            const item = d.slice(0, d.length - units.length - 13);
            ross.push({
              Item: item,
              Description: description,
              Units: Number(units),
              Price: price,
              "Extended Price": extendedPrice,
              PO: Number(po),
              "Cancel Date": cancelDate,
              "FOB Point": fob
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
