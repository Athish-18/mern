import express from 'express'
import { aiSearch, aiInsight, aiCompare, aiAdvisor, aiMarketSnapshot } from '../controllers/ai.controller.js'

const router = express.Router()

router.post('/chat', aiSearch)
router.post('/insight', aiInsight)
router.post('/compare', aiCompare)
router.post('/advisor', aiAdvisor)
router.post('/market-snapshot', aiMarketSnapshot)

export default router
