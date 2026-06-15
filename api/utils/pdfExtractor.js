import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export const extractTextFromLocalPdf = async (localPath) => {
  try {
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found at path: ${localPath}`);
    }
    
    // Read the file directly from the local disk
    const buffer = fs.readFileSync(localPath);

    // Parse the PDF
    const data = await pdf(buffer);

    return {
      text: data.text,
      numpages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    throw new Error(`PDF Extraction Failed: ${error.message}`);
  }
};
