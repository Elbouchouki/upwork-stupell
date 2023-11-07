import { randomUUID } from 'crypto';
import PDFParser from 'pdf2json';
import { promises as fs } from 'fs';
import { OTPExtractor } from '@/types';

export const otpExtractor = async (file: File): Promise<OTPExtractor[]> => {

  const fileName = randomUUID();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  let ross: OTPExtractor[] = [];

  const pdfParser = new PDFParser(null, 10);

  pdfParser.on('pdfParser_dataError', (errData: any) =>
    console.log(errData.parserError)
  );

  pdfParser.on('pdfParser_dataReady', () => {
    const lines = (pdfParser as any).getRawTextContent().split('\n');
    for (let i = 0; i < lines.length; i++) {

      if (lines[i].trim().includes("Purchase OrderP/O Number:")) {
        let po = (lines[i].trim() as string).match(/P\/O Number:\s+(\d+)/)?.[1]
        while (!lines[i].trim().includes("Vendor Part No.SKU NumberUPC")) i++;
        i++

        while ((lines[i].trim() as string).toLocaleLowerCase().startsWith("otp")) {
          const otpRegex = /^(\S+)\s+(\S+)\s+(\S+)\s+(.+?)\s+(\S+)\s+(\S+)\s+(\S+)\s+([\d,]+\.\d+)$/;
          const match = lines[i].trim().match(otpRegex);
          if (match) {
            const otpNumber = match[1];
            const number1 = (match[2] as string)
            const description = "" + (match[4] as string).match(/^(\S.*?)\s+\d+\.\d+\s+\d+\.\d+\s+\d+$/)?.[1].trim();
            const price = (match[4] as string).match(/(\d+\.\d+)\s+\d+$/)?.[1];
            const units = match[6];
            const finalPrice = (match[8] as string).replace(',', '');
            console.log(`OTP Number: ${otpNumber}, Number1: ${number1}, Description: ${description}, Price: ${price}, Units: ${units}, Final Price: ${finalPrice}`)
            ross.push({
              Item: otpNumber,
              "OTP Item": number1,
              Description: description,
              Units: Number(units),
              Price: Number(price),
              "Extended Price": Number(finalPrice),
              PO: Number(po)
            })
          } else {
            console.log("No match found in the input.");
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
