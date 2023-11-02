import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { BHCExtractorData } from '@/types';

export const bhcExtractor = async (file: File): Promise<BHCExtractorData[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: BHCExtractorData[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  function extractUnitAndCost(inputString: string) {
    const priceRegex = /\$\d+\.\d+/g;
    const prices = inputString.match(priceRegex);
    let units = -1, cost = -1;
    if (prices && prices.length >= 3) {
      units = Number(prices[2].match(/\.\d+$/)?.[0].slice(3))
      cost = Number(prices[0].slice(1));
    }
    return {
      units,
      cost
    }
  }

  function extractDetails(inputString: string) {
    const regex = /^([A-Z])(\d{8})([A-Z0-9]{6})([^.]+)\.(\d+)\.(.+)$/;
    const match = inputString.match(regex);
    const pack = match![1];
    const SKU = match![2];
    const mfgStyle = match![3];
    const packQty = match![4];
    const description = match![5];
    return {
      pack, SKU, mfgStyle, packQty, description
    }
  }

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n');

    for (let i = 0; i < lines.length; i++) {

      if (lines[i].trim().includes("DEPT. NUMBER:ORDER NUMBER")) {
        let po = (lines[i].trim() as string).slice(26)
        let j = i;
        let count = 0;
        while (!lines[j].trim().includes("Cancel Date:")) j++;
        let date = lines[j].trim().slice("Cancel Date:".length);
        j = i;
        while (!lines[j].trim().includes("Mark For:")) j++;
        let markFor = lines[j + 2].trim()
        j = i + 1;

        while (j < lines.length) {
          if (lines[j].trim().includes("DEPT. NUMBER:ORDER NUMBER")) break;
          if (lines[j].trim().includes("CompRetailTotal")) count++;
          j++;
        }

        while (!lines[i].trim().includes("CompRetailTotal")) i++

        const regexPattern = /^[A-C]\d+[A-Z].*\.\d+\.\d+X\d+[A-Z]+/;

        let itr = count;

        j = i;

        while (itr > 0 && j < lines.length) {
          if (regexPattern.test(lines[j].trim())) {
            const { SKU, description, mfgStyle, pack, packQty } = extractDetails(lines[j].trim())
            while (!lines[j].trim().includes("UPC")) j++;
            const upc = lines[j].trim().slice(5);
            j++;
            const { cost, units } = extractUnitAndCost(lines[j].trim())
            ross.push({
              Pack: pack,
              SKU,
              "MFG Style": mfgStyle,
              "Pack Qty": packQty,
              Description: description,
              UPC: upc,
              "Cost/Unit": cost,
              "Total Units": units,
              PO: Number(po),
              "Cancel Date": date,
              "Mark For": markFor
            })
            itr--;
          }
          j++;
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

  return ross.filter((item) => !!item);
}