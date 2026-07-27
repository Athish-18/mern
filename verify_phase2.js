import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { askBrochure } from './api/controllers/brochure.controller.js';
import Brochure from './api/models/brochure.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB for Phase 2 Verification...");
    
    const brochures = await Brochure.find().sort({ createdAt: -1 }).limit(1);
    if (!brochures || brochures.length === 0) {
        console.log("No brochures found to test with.");
        process.exit(1);
    }
    const listingRef = brochures[0].listingRef;
    
    const questions = [
        "What are the main amenities?",
        "Is there a swimming pool?",
        "What is the size of the clubhouse?",
        "Are there any sports facilities?",
        "Tell me about the outdoor party lawn."
    ];

    for (let i = 0; i < questions.length; i++) {
        console.log(`\n\n--- QUESTION ${i+1} ---`);
        console.log(`Q: ${questions[i]}`);
        
        let responseJson = null;
        let responseStatus = null;
        
        const mockReq = {
            body: {
                question: questions[i],
                listingRef: listingRef
            }
        };
        
        const mockRes = {
            status: (code) => {
                responseStatus = code;
                return {
                    json: (data) => {
                        responseJson = data;
                    }
                };
            }
        };
        
        const mockNext = (err) => {
            console.error("ERROR in next():", err);
        };
        
        await askBrochure(mockReq, mockRes, mockNext);
        
        console.log(`Status: ${responseStatus}`);
        console.log(`Answer:\n${responseJson?.answer}`);
        console.log(`Sources: ${JSON.stringify(responseJson?.sources)}`);
        
        // Wait 4 seconds to avoid Groq free tier rate limits
        await new Promise(r => setTimeout(r, 4000));
    }

    process.exit(0);
};

run();
