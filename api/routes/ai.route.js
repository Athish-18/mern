import express from 'express'
import { aiSearch, aiInsight, aiCompare } from '../controllers/ai.controller.js'

const router = express.Router()

router.post('/chat', aiSearch)
router.post('/insight', aiInsight)
router.post('/compare', aiCompare)

export default router
