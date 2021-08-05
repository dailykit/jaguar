import express from 'express'
import { handleStatusChange } from './controllers'

const router = express.Router()

router.route('/status').post(handleStatusChange)

export default router
