import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brochure from './api/models/brochure.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'api', '.env') });

mongoose.connect(process.env.MONGO).then(async () => {
  console.log('Connected to MongoDB');
  const brochures = await Brochure.find().sort({ createdAt: -1 }).limit(1);
  if (brochures.length > 0) {
    const b = brochures[0];
    console.log('Latest Brochure ID:', b._id);
    console.log('Listing Ref:', b.listingRef);
    console.log('Summary:', b.summary);
    console.log('Suggested Questions:', b.suggestedQuestions);
  } else {
    console.log('No brochures found.');
  }
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
