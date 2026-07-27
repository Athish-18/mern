import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

mongoose.connect(process.env.MONGO).then(async () => {
  console.log('Connected to MongoDB');
  
  const Chunk = mongoose.model('BrochureChunk', new mongoose.Schema({}, {collection: 'brochurechunks'}));
  const Brochure = mongoose.model('Brochure', new mongoose.Schema({}, {collection: 'brochures'}));

  console.log('Deleting all Brochure documents...');
  const resB = await Brochure.deleteMany({});
  console.log(`Deleted ${resB.deletedCount} brochures.`);

  console.log('Deleting all BrochureChunk documents...');
  const resC = await Chunk.deleteMany({});
  console.log(`Deleted ${resC.deletedCount} chunks.`);

  console.log('Clearing local uploads folder...');
  const dir = path.join(process.cwd(), 'uploads', 'brochures');
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      fs.unlinkSync(path.join(dir, file));
    }
    console.log(`Deleted ${files.length} local PDF files.`);
  } else {
    console.log('No local uploads folder found.');
  }

  console.log('Clean up complete!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
