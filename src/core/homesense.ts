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
    const lines = ((pdfParser as any).getRawTextContent() as string).replaceAll("COSTVENDOR STYLECOLOURDETAILED DESCRIPTIONUNITSVEND PACKSR PACKMSTR CTNPACKS", "")
      .replaceAll(/Page (\d+)of (\d+)/g, "")
      .replaceAll(/-+Page \((\d+)\) Break-+/g, "")
      .replaceAll("Pre Prod Sample:Prod Sample: Inspection Required By:Hang Tags:Hang Tags Description: Sets:Boxed:Fibre Type:Stuff Artl:Ens/Coord:", "")
      .replaceAll("Ticket Type:Ticket Message 1:Ticket Message 2:Label:Label Desc:Content:Quebec Indicator:", "")
      .replaceAll("Units/Size:", "")
      .replaceAll("PAGE-", "")
      .replaceAll("UNIT", "")
      .replaceAll("ENQuebec Ready", "")
      .replaceAll("LINECATGSTYLETYPE", "")
      .replaceAll("Size Ratio:", "")
      .split('\n').filter((line: string) => (line && line.trim().length && !line.includes("IF IRREGULAR NO HOLES, STAINS, BROKEN ZIPPERS OR DAMAGES IF SAMPLE DATE(S) APPEAR") && !line.includes("CANDLES MUST HAVE CANDLE BURNING")))

    for (let i = 0; i < lines.length; i++) {
      if ((lines[i].trim() as string).toUpperCase().includes("IMPORT PO NUMBER:")) {
        let po = Number((lines[i].trim() as string).toUpperCase().replace("IMPORT PO NUMBER:", "").trim())
        while (!(lines[i].trim() as string).toUpperCase().includes("FREIGHT FORWARDER BYPAYMENT TERMSPAYMENT TYPE")) i++;
        i++;
        const datex = ((lines[i].trim() as string).match(/[A-Z]{3}-(\d{2})-(\d{4})/g)?.[2] as string).split("-")
        const cancelDate = formatDate(datex[1], datex[0], datex[2])
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
        // fs.writeFile(`HomeSense.txt`, data.join("\n"))
        let itr = Math.ceil(data.length / 2);
        while (itr >= 0) {
          const d = [data.at(itr * 2), data.at(itr * 2 + 1)]
          d.sort((a, b) => a!.length - b!.length)
          const first = d[0]
          const second = d[1]
          if (first && second) {
            const nest = first?.charAt(first.length - 1)
            const regex = /(\d+)$/;
            const splitted = second.split(" ")
            const match = splitted[splitted.length - 1].match(regex);
            if (match) { // LOVED6003020 -> 6003020
              const lastNumber = match[1];

              const regex = /(\d+\.\d+)/;
              const units = Number(lastNumber.slice(0, lastNumber.length - 5))
              const pcsPerNest = Number(lastNumber.charAt(lastNumber.length - 4))

              const m = splitted[0].slice("86060872378".length).match(regex);

              if (m) {
                const price = Number(m[1]);

                const temp = splitted[0].slice("86060872378".length).replace(m[1], "")
                const item = temp.slice(0, "HWY196".length)
                let desc = temp.slice("HWY196".length) + " " + splitted.slice(1, splitted.length - 1).join(" ") + " " + splitted[splitted.length - 1].slice(0, splitted[splitted.length - 1].length - lastNumber.length)
                const extandedPrice = units * price

                ross.push({
                  Item: item,
                  Description: desc,
                  Units: units,
                  Price: price,
                  "Extended Price": extandedPrice,
                  "Pcs Per Nest": pcsPerNest,
                  Nest: nest,
                  PO: po,
                  "Cancel If Not...": cancelDate
                })

              } else {
                console.log("No double found in the input string.");
              }

            } else {
              console.log("No number found at the end of the input string.");
            }
          }
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

  ross.reverse()

  if (ross.length === 0) throw new Error("No data found in PDF file");

  return ross.filter((item) => !!item)
}
