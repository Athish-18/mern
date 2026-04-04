import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Listing from './models/listing.model.js'
import { getCoordinates } from './utils/geocode.js'

dotenv.config()

await mongoose.connect(process.env.MONGO)

const listings = await Listing.find({})
console.log(`Found ${listings.length} listings\n`)

for (const listing of listings) {
  console.log(`--- ${listing.name}`)
  console.log(`    Address : ${listing.address}`)
  console.log(`    Coords  : lat=${listing.latitude}, lon=${listing.longitude}`)

  if (!listing.latitude || !listing.longitude) {
    console.log(`    → No coords, geocoding now...`)
    try {
      const { latitude, longitude } = await getCoordinates(listing.address)
      listing.latitude = latitude
      listing.longitude = longitude
      await listing.save()
      console.log(`    ✅ Saved: lat=${latitude}, lon=${longitude}`)
    } catch (err) {
      console.log(`    ❌ FAILED: ${err.message}`)
    }
  } else {
    console.log(`    ✅ Already has coords, skipping`)
  }
}

console.log('\nDone!')
await mongoose.disconnect()
