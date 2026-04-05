import Listing from '../models/listing.model.js'
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
