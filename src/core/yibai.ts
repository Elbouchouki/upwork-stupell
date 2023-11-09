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

  function getItem(line: string) {
    const regex = /^([A-Z]{3}\d{3}[A-Z]*)(\w?)([A-Z]*)/;
    const match = line.match(regex);
    if (match) {
      return match[1]
    } else {
      console.log(`No match for ${line}`);
    }
    return "NO MATCH"
  }
  function getNumbers(line: string) {
    const regex = /(\d+(\.\d{1,2})?)\$(\d+(\.\d{1,2})?)US\$(\d+(\.\d{1,2})?)/;
    const match = line.replace(/,/g, '').match(regex);
    if (match) {
      const n2 = Number(match[3])
      const n3 = Number(match[5])
      return [Number((n3 / n2).toFixed(0)), n2, n3]
    } else {
      console.log(`No match for ${line}`);
    }
    return [null, null, null];
  }

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n').filter((line: string) => (line && line.trim().length && !line.includes("--------------")))
    const all: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      while (i < lines.length && !lines[i].toUpperCase().includes("PER ORDER INSTRUCTION")) i++;
      while (i < lines.length && !lines[i].toUpperCase().includes("SAY TOTAL")) {
        all.push(lines[i].trim());
        i++;
      }
    }
    all.pop()
    const newlines = all.join(" ").replace(/(\r\n|\n|\r)/gm, "").split("Per Order Instruction").filter(l => l && l.length)
    for (let line of newlines) {
      const splitted = line.trim().split(" ");
      const dirtyItem = splitted[0]
      const item = getItem(dirtyItem)
      let description = (dirtyItem.replace(item, "").trim() + " " + splitted.slice(1, splitted.length - 1).join(" "))
      description = description.slice(0, 40) + (description.length > 40 ? "..." : "")
      const [n1, n2, n3] = getNumbers(splitted[splitted.length - 1])
      if (n1 && n2 && n3) {
        ross.push({
          Item: item,
          Description: description,
          Units: n1,
          Price: n2,
          "Extended Price": n3,
        })
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
