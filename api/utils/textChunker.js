import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const chunkText = async (text, chunkSize = 800, overlap = 150) => {
  if (!text || typeof text !== 'string') return [];
  
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
  });
  
  const docs = await splitter.createDocuments([text]);
  return docs.map(doc => doc.pageContent);
};
