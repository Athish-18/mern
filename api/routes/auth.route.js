import express from 'express'
import { signin, signup } from '../controller/auth.controller.js' // Ensure correct import

const router = express.Router()

// Define POST route for signup
router.post('/signup', signup)
router.post('/signin', signin)

export default router
