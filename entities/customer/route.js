import express from 'express'
import { getCustomer, create } from './controllers'

const router = express.Router()

router.route('/create').post(create)
router.route('/:email').get(getCustomer)

export default router
