import { randomUUID, setFips } from 'crypto';
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
    const lines = ((pdfParser as any).getRawTextContent() as string).replaceAll("COSTVENDOR STYLECOLOURDETAILED DESCRIPTIONUNITSVEND PACKSR PACKMSTR CTNPACKS", "")
      .replaceAll(/Page (\d+)of (\d+)/g, "")
      .replaceAll(/-+Page \((\d+)\) Break-+/g, "")
      .replaceAll("Pre Prod Sample:Prod Sample: Inspection Required By:Hang Tags:Hang Tags Description: Sets:Boxed:Fibre Type:Stuff Artl:Ens/Coord:", "")
      .replaceAll("Ticket Type:Ticket Message 1:Ticket Message 2:Label:Label Desc:Content:Quebec Indicator:", "")
      .replaceAll("Units/Size:", "")
      .replaceAll("PAGE-", "")
      .replaceAll("UNIT", "")
      .replaceAll("LINECATGSTYLETYPE", "")
      .replaceAll("Size Ratio:", "")
      .split('\n').filter((line: string) => (line && line.trim().length && !line.includes("IF IRREGULAR NO HOLES, STAINS, BROKEN ZIPPERS OR DAMAGES IF SAMPLE DATE(S) APPEAR") && !line.includes("CANDLES MUST HAVE CANDLE BURNING")))
    for (let i = 0; i < lines.length; i++) {
      if ((lines[i].trim() as string).toUpperCase().includes("IMPORT PO NUMBER:")) {
        let po = (lines[i].trim() as string).toUpperCase().replace("IMPORT PO NUMBER:", "").trim()
        while (!(lines[i].trim() as string).toUpperCase().includes("FREIGHT FORWARDER BYPAYMENT TERMSPAYMENT TYPE")) i++;
        i++;
        const datex = ((lines[i].trim() as string).match(/[A-Z]{3}-(\d{2})-(\d{4})/g)?.[2] as string).split("-")
        const cancelDate = formatDate(datex[1], datex[0], datex[2])
        console.log(po, cancelDate)
        let count = 1;
        let data: string[] = []
        while (i < lines.length && !lines[i].startsWith(`1-${count}`)) i++;
        while (i < lines.length && !lines[i].includes("IMPORTANT VENDOR INFORMATION")) {
          if (lines[i].startsWith(`1-${count}`)) {
            if (lines[i].length !== `1-${count}`.length) {
              data.push(lines[i].replace(`1-${count}`, "").trim().replace(/\r?\n|\r/g, "").trim())
            }
            count++;
          } else {
            data.push(lines[i].replace(/\r?\n|\r/g, "").trim())
          }
          i++;
        }
        data = data.filter((item) => item && item.length)
        fs.writeFile(`HomeSense.txt`, data.join("\n"))
        let itr = Math.floor(data.length / 3);
        console.log(itr)
        while (itr > 0) {
          const first = data.at(itr * 3)
          const second = data.at(itr * 3 + 1)
          const third = data.at(itr * 3 + 2)
          console.log(first, second, third)
          itr--;
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
