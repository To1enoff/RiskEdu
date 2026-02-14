declare module 'pdf-parse' {
  interface PdfParseResult {
    text: string;
  }

  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}
