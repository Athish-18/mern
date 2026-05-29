import Listing from '../models/listing.model.js'
import User from '../models/user.model.js'
import { errorHandler } from '../utils/error.js'
import { getCoordinates } from '../utils/geocode.js'

export const createListing = async (req, res, next) => {
  try {
    let latitude
    let longitude
    try {
      const coords = await getCoordinates(req.body.address)
      latitude = coords.latitude
      longitude = coords.longitude
    } catch (err) {
      console.log('Geocoding failed:', req.body.address)
    }

    const listing = await Listing.create({
      ...req.body,
      latitude,
      longitude,
    })
    return res.status(201).json(listing)
  } catch (error) {
    next(error)
  }
}

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id)

  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'))
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only delete your own listings!'))
  }

  try {
    await Listing.findByIdAndDelete(req.params.id)
    res.status(200).json('Listing has been deleted!')
  } catch (error) {
    next(error)
  }
}

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id)
  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'))
  }
  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only update your own listings!'))
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    )
    res.status(200).json(updatedListing)
  } catch (error) {
    next(error)
  }
}

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'))
    }

    if (!listing.latitude || !listing.longitude) {
      try {
        const { latitude, longitude } = await getCoordinates(listing.address)
        listing.latitude = latitude
        listing.longitude = longitude
        await listing.save()
      } catch (err) {
        console.log('Geocoding failed for:', listing.address)
      }
    }

    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9
    const startIndex = parseInt(req.query.startIndex) || 0
    let offer = req.query.offer

    if (offer === undefined || offer === 'false') {
      offer = { $in: [false, true] }
    }

    let furnished = req.query.furnished

    if (furnished === undefined || furnished === 'false') {
      furnished = { $in: [false, true] }
    }

    let parking = req.query.parking

    if (parking === undefined || parking === 'false') {
      parking = { $in: [false, true] }
    }

    let type = req.query.type

    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] }
    }

    // Dynamic precise filters
    const filterQuery = {}
    if (req.query.bedrooms) filterQuery.bedrooms = parseInt(req.query.bedrooms)
    if (req.query.bathrooms) filterQuery.bathrooms = parseInt(req.query.bathrooms)

    const searchTerm = req.query.searchTerm || ''
    const sort = req.query.sort || 'createdAt'
    const order = req.query.order || 'desc'
    const minPrice = parseInt(req.query.minPrice) || 0
    const maxPrice = parseInt(req.query.maxPrice) || 1000000000

    const listings = await Listing.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
      offer,
      furnished,
      parking,
      type,
      ...filterQuery,
      regularPrice: {
        $gte: minPrice,
        $lte: maxPrice,
      },
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex)

    return res.status(200).json(listings)
  } catch (error) {
    next(error)
  }
}

export const getRecommendations = async (req, res, next) => {
  try {
    const currentListing = await Listing.findById(req.params.id)
    if (!currentListing) {
      return next(errorHandler(404, 'Listing not found!'))
    }

    // Fetch potential candidates (exclude current, limit to recent 100 for performance)
    const candidates = await Listing.find({ _id: { $ne: currentListing._id } }).limit(100)
    
    // Calculate scores in-memory
    const scoredCandidates = candidates.map((candidate) => {
      let score = 0
      
      // 1. Same Type (+10) (Highest Priority)
      if (candidate.type === currentListing.type) score += 10
      
      // 2. Same Locality (+5) (High Priority)
      // Extract main locality from address (assuming comma-separated structure like "Street, City")
      const currentAddressParts = currentListing.address.split(',').map(s => s.trim().toLowerCase())
      const candidateAddress = candidate.address.toLowerCase()
      
      if (currentAddressParts.length > 0) {
          const mainArea = currentAddressParts[currentAddressParts.length - 1] // Last part is usually city or state
          if (candidateAddress.includes(mainArea)) score += 5
      }

      // 3. Bedroom Match (+3) (Medium Priority)
      if (candidate.bedrooms === currentListing.bedrooms) score += 3

      // 4. Similar Price Range (+3) (Medium Priority - within 20%)
      const priceDiff = Math.abs(candidate.regularPrice - currentListing.regularPrice)
      if (priceDiff <= currentListing.regularPrice * 0.2) score += 3

      return { ...candidate._doc, score }
    })

    // Sort by score descending and take top 4
    const topRecommendations = scoredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)

    // Remove the temporary score field before sending
    const cleanedRecommendations = topRecommendations.map(rec => {
      const { score, ...rest } = rec
      return rest
    })

    res.status(200).json(cleanedRecommendations)
  } catch (error) {
    next(error)
  }
}

export const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const { profile } = req.body;
    // req.user might be available if we use verifyToken, but we might call this conditionally without auth middleware.
    // Wait, the client will pass a cookie so we can optionally verify it, or just use the user ID from the frontend.
    // Let's rely on req.user if passed through a middleware, or the frontend can send userId.
    const { userId } = req.body;
    
    let userFavorites = [];
    if (userId) {
       const user = await User.findById(userId).populate('favorites');
       if (user) {
         userFavorites = user.favorites.map(f => f._id.toString());
       }
    }
    
    // Fetch a sample of recent/active listings to score against (limit to 200 for performance)
    const allListings = await Listing.find().limit(200);
    
    const scoredListings = allListings.map(listing => {
       let score = 0;
       
       // Exclude properties they already favorited
       if (userFavorites.includes(listing._id.toString())) {
           return { ...listing._doc, score: -100 };
       }
       
       // 1. Same Location (+5)
       const addressParts = listing.address.toLowerCase().split(',');
       const mainArea = addressParts[addressParts.length - 1]?.trim();
       if (profile?.preferredLocations?.includes(mainArea)) score += 5;
       
       // 2. Same Type (+5)
       if (listing.type === profile?.preferredType) score += 5;
       
       // 3. Similar Price (+3)
       const price = listing.offer ? listing.discountPrice : listing.regularPrice;
       if (profile?.preferredPriceRange) {
           if (price >= profile.preferredPriceRange.min && price <= profile.preferredPriceRange.max) score += 3;
       }
       
       // 4. Same Bedrooms (+2)
       if (listing.bedrooms === profile?.preferredBedrooms) score += 2;
       
       return { ...listing._doc, score };
    });
    
    const recommendations = scoredListings
       .filter(l => l.score > 0)
       .sort((a, b) => b.score - a.score)
       .slice(0, 6);
       
    res.status(200).json(recommendations.map(({score, ...rest}) => rest));
  } catch (error) {
    next(error);
  }
}
