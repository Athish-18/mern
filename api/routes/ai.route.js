import express from 'express'
import { aiSearch, aiInsight } from '../controllers/ai.controller.js'

const router = express.Router()

router.post('/chat', aiSearch)
router.post('/insight', aiInsight)

export default router
