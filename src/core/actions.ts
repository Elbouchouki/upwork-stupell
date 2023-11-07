import { atHomeExtractor } from "./at-home"
import { bhcExtractor } from "./bhc"
import { homeGoodsExtractor } from "./homegoods"
// import { homeSenseExtractor } from "./homesense"
import { otpExtractor } from "./otp"
import { rossExtractor } from "./ross"
import { taizhouExtractor } from "./taizhou"
// import { yibaiExtractor } from "./yibai"

export const extractorsPerType = {
  "Ross Stores PO": rossExtractor,
  "BHC PO": bhcExtractor,
  "OTP PO": otpExtractor,
  "Taizhou SC": taizhouExtractor,
  // "Yibai SC": yibaiExtractor,
  // "HomeSense aka Winners PO": homeSenseExtractor,
  "AT HOME PO": atHomeExtractor,
  "HomeGoods PO": homeGoodsExtractor
}

export const extractor = async (type: string, file: File) => {
  let f = extractorsPerType[type as keyof typeof extractorsPerType]
  if (!f) throw new Error("Invalid pdf type")
  return await f(file)
}