import mongoose from 'mongoose'

const brochureChunkSchema = new mongoose.Schema(
  {
    brochureRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brochure',
      required: true,
    },
    listingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    category: {
      type: String,
      enum: ['luxury-villa', 'premium-apartment', 'residential-township', 'general'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true },
)

const BrochureChunk = mongoose.model('BrochureChunk', brochureChunkSchema)

export default BrochureChunk
