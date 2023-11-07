import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { HomeGoodsExtractor } from '@/types';

export const homeGoodsExtractor = async (file: File): Promise<HomeGoodsExtractor[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: HomeGoodsExtractor[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  pdfParser.on('pdfParser_dataReady', () => {
    const lines: string[] = ((pdfParser as any).getRawTextContent().split('\n') as string[]).filter(line => line !== null)
    for (let i = 0; i < lines.length; i++) {
      let j = 0;
      while (i < lines.length && (!lines[i] || !lines[i].trim().includes("CONSOLIDATOR:"))) i++; i++;
      let cancelDate = ""
      if (lines[i]) {
        j = i;
        cancelDate = lines[i].slice(0, "9/7/2023".length)
      }
      while (i < lines.length && (!lines[i] || !lines[i].trim().includes("PO NO:"))) i++
      // let po = 
      if (lines[i]) {
        const index = lines[i].trim().indexOf("PO NO:")
        if (index !== -1) {
          let po = lines[i].trim().split(" ")[2].replace("NO:", "").replace("REFERENCE", "")
          console.log(po, cancelDate);
          // 1/2484895.80ADF1371114
          let count = 0;
          let last = 1
          while (!lines[j].trim().toUpperCase().includes("PAGE/LINEVENDOR STYLECOLORDETAILED DESCRIPTIONSIZE")) {
            const regex = /\d+\/\d+\.\w+/;
            const matches = lines[j].trim().match(regex);
            if (matches) {
              const splited = lines[j].trim().replace("SIZE RATIO:  LABELS:LABEL CODE:CONTENT:TKT MSG 1:TKT MSG 2:COC DUE DATE:", "").split(" ")
              const regex = /([A-Z]+)(\d+)/;
              const match = splited[splited.length - 1].match(regex);
              if (match) {
                let currentNumber = Number(splited[0].charAt(0))
                if (currentNumber === last) {
                  count++
                } else {
                  count = 1;
                  last = currentNumber
                }
                let items = ""
                const regex = /\d+\.\d+([A-Z0-9]+)/;
                const firstPart = match[1]; // 'UG'
                const secondPart = match[2]; // '400'
                const lastNumbers = splited[0].slice(splited[0].length - 4, splited[0].length) // '1114'
                const description = lastNumbers + splited.slice(1, splited.length - 1).join(" ") + " " + firstPart
                const without = splited[0].replace(lastNumbers, "").match(regex)
                let price = 0;
                if (without) {
                  price = Number(without[0].slice(String(count).length + 5, without[0].length).replace(without[1], ""))
                  items = without[1]; //  "HFT35"
                }
                const units = Number(secondPart.slice(0, secondPart.length - 1))
                ross.push({
                  Item: items,
                  Description: description,
                  Units: units,
                  Price: price,
                  "Extended Price": price * units,
                  "Pcs Per Nest": Number(splited[splited.length - 1].charAt(splited[splited.length - 1].length - 4)),
                  Nest: splited[splited.length - 1].charAt(splited[splited.length - 1].length - 3),
                  PO: Number(po),
                  "Cancel Date": cancelDate,
                })
              } else {
                console.log("can't extract units");
              }
            }
            j++;
          }
          i = j;
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
