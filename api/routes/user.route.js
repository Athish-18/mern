import express from 'express'
import {
  deleteUser,
  test,
  updateUser,
  getUserListings,
  getUser,
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
} from '../controllers/user.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.get('/test', test)
router.post('/update/:id', verifyToken, updateUser)
router.delete('/delete/:id', verifyToken, deleteUser)
router.get('/listings/:id', verifyToken, getUserListings)
router.post('/favorite/:listingId', verifyToken, addFavorite)
router.delete('/favorite/:listingId', verifyToken, removeFavorite)
router.get('/favorites/:id', verifyToken, getFavorites)
router.get('/favorite/check/:listingId', verifyToken, checkFavorite)
router.get('/:id', verifyToken, getUser)

export default router
