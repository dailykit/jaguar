import express from 'express'
import { fullOccurenceReport, actionFullOccurenceReport } from './controllers'

const router = express.Router()

router.route('/report').get(fullOccurenceReport)
router.route('/actionreport').post(actionFullOccurenceReport)
export default router
