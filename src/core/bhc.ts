import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { BHCExtractorData } from '@/types';

function extractUnitAndCostV2(inputString: string) {
  const priceRegex = /\$\d+\.\d+/g;
  const prices = inputString.match(priceRegex);
  let units = -1, cost = -1;
  if (prices && prices.length >= 3) {
    cost = Number(prices[0].slice(1))
    let temp = inputString.replace(prices[0], "").replace(prices[1], "").replace(prices[2], "")
    units = Number(prices[2].slice(prices[2].length - 2, prices[2].length))
  }
  return {
    units,
    cost
  }
}

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

// function extractDetailsV2(inputString: string) {
//   console.log(inputString)
//   const regex = /^([A-Z])(\d{8})([A-Z0-9]{6})([^.]+)\.(\d+)\.(.+)$/;
//   const match = inputString.match(regex);
//   const pack = match![1];
//   const SKU = match![2];
//   const mfgStyle = match![3];
//   const packQty = match![4];
//   const description = match![5];
//   return {
//     pack, SKU, mfgStyle, packQty, description
//   }
//   return { SKU, description, mfgStyle, pack, packQty }
// }

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

const bhcV1 = (lines: string[]) => {
  let ross: BHCExtractorData[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== undefined && (lines[i] as string).trim().includes("DEPT. NUMBER:ORDER NUMBER")) {
      let po = (lines[i].trim() as string).slice(26)
      let j = i;
      while (!lines[j].trim().includes("Cancel Date:")) j++;
      let date = lines[j].trim().slice("Cancel Date:".length);
      j = i;
      while (!lines[j].trim().includes("Mark For:")) j++;
      let markFor = lines[j + 2].trim()
      j = i + 1;

      const regexPattern = /^[A-Z]\d+[A-Z].*\.\d+\.\d+X\d+[A-Z]+/;

      while (j < lines.length) {
        if (lines[j].trim().includes("DEPT. NUMBER:ORDER NUMBER")) break;
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
            "Pack Qty": Number(description),
            Description: packQty,
            UPC: upc,
            "Cost/Unit": cost,
            "Total Units": units,
            PO: Number(po),
            "Cancel Date": date,
            "Mark For": markFor
          })
        }
        j++;
      }
    }
  }
  return ross;
}

const bhcV2 = (lines: string[]) => {
  let ross: BHCExtractorData[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== undefined && (lines[i] as string).trim().includes("DEPT. NUMBER:ORDER NUMBER")) {
      let po = (lines[i].trim() as string).slice(26)
      let j = i;
      while (!lines[j].trim().includes("Cancel Date:")) j++;
      let date = lines[j].trim().slice("Cancel Date:".length);
      j = i;
      while (!lines[j].trim().includes("Mark For:")) j++;
      let markFor = lines[j + 2].trim()
      j = i + 1;

      console.log(po, date, markFor)

      const regexPattern = /^\d{8}[A-Za-z0-9]{6}/;

      while (j < lines.length) {
        if (lines[j].trim().includes("DEPT. NUMBER:ORDER NUMBER")) break;
        const match = lines[j].trim().match(regexPattern);
        if (match) {
          const SKU = match[0].slice(0, 8)
          const mfgStyle = match[0].slice(8)
          const pack = lines[j].trim().charAt("79003115SHB123".length)
          while (!lines[j].trim().includes("UPC")) j++;
          const upc = lines[j].trim().slice(5);
          j++;
          const { cost, units } = extractUnitAndCostV2(lines[j].trim())
          ross.push({
            Pack: pack,
            SKU,
            "MFG Style": mfgStyle,
            "Pack Qty": -1,
            Description: "BHC V2",
            UPC: upc,
            "Cost/Unit": cost,
            "Total Units": units,
            PO: Number(po),
            "Cancel Date": date,
            "Mark For": markFor
          })
        }
        j++;
      }
    }
  }
  return ross;
}


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

  pdfParser.on('pdfParser_dataReady', () => {
    const lines: string[] = ((pdfParser as any).getRawTextContent().split('\n') as string[]).filter((line: string) => (line || line.length !== 0))

    let j = 0;
    while (lines[j] !== undefined && !lines[j].trim().toUpperCase().includes("SKU")) j++;
    const f = lines[j].trim().toUpperCase().startsWith("PACK") ? bhcV1 : bhcV2;
    for (let i = 0; i < lines.length; i++) {
      ross = f(lines)
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