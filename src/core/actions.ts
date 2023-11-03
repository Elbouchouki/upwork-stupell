import { bhcExtractor } from "./bhc"
import { otpExtractor } from "./otp"
import { rossExtractor } from "./ross"

export const extractorsPerType = {
  "Ross Stores PO": rossExtractor,
  "BHC PO": bhcExtractor,
  "OTP PO": otpExtractor,
}

export const extractor = async (type: string, file: File) => {
  let f = extractorsPerType[type as keyof typeof extractorsPerType]
  if (!f) throw new Error("Invalid pdf type")
  return await f(file)
}