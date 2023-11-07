export interface RossExtractorData {
  "Item": string,
  "Description": string,
  "Cost": number,
  "Units": number,
  "Pcs Per Nest": number,
  "Nest": string,
  "PO": number,
  "Cancel Date": string
}

export interface BHCExtractorData {
  "Pack": string,
  "SKU": string,
  "MFG Style": string,
  "Pack Qty": number,
  "Description": string,
  "UPC": string,
  "Cost/Unit": number,
  "Total Units": number,
  "PO": number,
  "Cancel Date": string,
  "Mark For": string,
}


export interface OTPExtractor {
  "Item": string,
  "OTP Item": string,
  "Description": string,
  "Units": number,
  "Price": number,
  "Extended Price": number,
  "PO": number
}

export interface TaizhouExtractor {
  "Item": string,
  "Description": string,
  "Units": number,
  "Cost": number,
  "Extended Cost": number,
  "PO": number
}

export interface HomeGoodsExtractor {
  "Item": string,
  "Description": string,
  "Units": number,
  "Price": number,
  "Extended Price": number,
  "Pcs Per Nest": number,
  "Nest": string,
  "PO": number
  "Cancel Date": string,
}


export interface YibaiSCExtractor {
  "Item": string,
  "Description": string,
  "Units": number,
  "Price": number,
  "Extended Price": number,
}

export interface HomeSenseExtractor {
  "Item": string,
  "Description": string,
  "Units": number,
  "Price": number,
  "Extended Price": number,
  "Pcs Per Nest": number,
  "Nest": string,
  "PO": number,
  "Cancel If Not...": string
}


export interface AtHomeExtractor {
  "Item": string,
  "Description": string,
  "Units": number,
  "Price": number,
  "Extended Price": number,
  "PO": number
  "Cancel Date": string
  "FOB Point": string
}

