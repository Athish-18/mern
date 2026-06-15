import mongoose from 'mongoose'

const brochureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['luxury-villa', 'premium-apartment', 'residential-township', 'general'],
      required: true,
    },
    localPath: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    vectorized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

const Brochure = mongoose.model('Brochure', brochureSchema)

export default Brochure
