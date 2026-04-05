import express from 'express'
import { aiSearch } from '../controllers/ai.controller.js'

const router = express.Router()

router.post('/search', aiSearch)

export default router
