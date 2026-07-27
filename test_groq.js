import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

mongoose.connect(process.env.MONGO).then(async () => {
  const Chunk = mongoose.model('BrochureChunk', new mongoose.Schema({listingRef: mongoose.Schema.Types.ObjectId, text: String}, {collection: 'brochurechunks'}));
  const Brochure = mongoose.model('Brochure', new mongoose.Schema({listingRef: mongoose.Schema.Types.ObjectId}, {collection: 'brochures'}));

  const b = await Brochure.find().sort({createdAt: -1}).limit(1);
  const chunks = await Chunk.find({listingRef: b[0].listingRef}).limit(8);
  const contextText = chunks.map(c=>c.text).join('\n\n');

  const prompt = `You are an AI assistant for a real estate platform. Based on the following brochure text, generate exactly two things:
1. "summary": 5-10 concise bullet points focusing on major selling points. No marketing fluff. Use the character '•' for bullets.
2. "questions": 5 highly relevant user questions about the project amenities, facilities, or features.

Return the response in exactly this JSON format:
{
  "summary": "• Point 1\\n• Point 2",
  "questions": ["Question 1?", "Question 2?"]
}

BROCHURE TEXT:
${contextText}`;

  fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  }).then(res=>res.json()).then(data=>{
    console.log("Raw output from Groq:");
    console.log(data.choices[0].message.content);
    try {
      const parsed = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed JSON!", parsed);
    } catch(err) {
      console.log("Failed to parse JSON:", err);
    }
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
});
