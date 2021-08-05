require('dotenv').config()
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import { createEvent } from 'ics'
import { writeFileSync } from 'fs'
const { ApolloServer } = require('apollo-server-express')
const depthLimit = require('graphql-depth-limit')
const schema = require('./streaming/ohyay/src/schema/schema')
import express from 'express'
import morgan from 'morgan'
import AWS from 'aws-sdk'
import bluebird from 'bluebird'
import {
   MOFRouter,
   MenuRouter,
   UserRouter,
   OrderRouter,
   sendMail,
   DeviceRouter,
   UploadRouter,
   RMKMenuRouter,
   initiatePayment,
   OccurenceRouter,
   WorkOrderRouter,
   NotificationRouter,
   RewardsRouter,
   ModifierRouter,
   emailParser,
   ParseurRouter,
   placeAutoComplete,
   placeDetails,
   StoreRouter,
   getDistance,
   authorizeRequest,
   handleImage,
   OhyayRouter,
   ExperienceRouter,
   handleCartPayment
   GetFullOccurenceRouter,
   CustomerRouter
} from './entities'
import { PrintRouter } from './entities/print'
import {
   printKOT,
   getKOTUrls,
   printLabel,
   handleThirdPartyOrder
} from './entities/events'
import {
   handleCustomerSignup,
   handleSubscriptionCancelled
} from './entities/emails'
const app = express()
const PORT = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production' ? true : false

const apolloserver = new ApolloServer({
   schema,
   playground: {
      endpoint: `${process.env.ENDPOINT}/graphql`
   },
   introspection: true,
   validationRules: [depthLimit(11)],
   formatError: err => {
      console.log(err)
      if (err.message.includes('ENOENT'))
         return isProd ? new Error('No such folder or file exists!') : err
      return isProd ? new Error(err) : err
   },
   debug: true,
   context: ({ req }) => {
      const ohyay_api_key = req.header('ohyay_api_key')
      return { ohyay_api_key }
   }
})

apolloserver.applyMiddleware({ app })

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
   morgan(
      '[:status :method :url] :remote-user [:date[clf]] - [:user-agent] - :response-time ms'
   )
)

AWS.config.update({
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

AWS.config.setPromisesDependency(bluebird)

// Routes
app.use('/api/mof', MOFRouter)
app.use('/api/menu', MenuRouter)
app.use('/api/order', OrderRouter)
app.use('/api/assets', UploadRouter)
app.use('/api/printer', PrintRouter)
app.use('/api/rmk-menu', RMKMenuRouter)
app.use('/api/inventory', WorkOrderRouter)
app.post('/api/initiate-payment', initiatePayment)
app.get('/api/place/autocomplete/json', placeAutoComplete)
app.get('/api/place/details/json', placeDetails)
app.post('/api/distance-matrix', getDistance)
app.post('/api/sendmail', sendMail)
app.use('/api/rewards', RewardsRouter)
app.get('/api/kot-urls', getKOTUrls)
app.use('/api/modifier', ModifierRouter)
app.use('/api/parseur', ParseurRouter)

app.use('/api/ohyay', OhyayRouter)
app.use('/api/experience', ExperienceRouter)
app.post('/api/handleCartPayment', handleCartPayment)
app.use('/api/occurences', GetFullOccurenceRouter)


app.use('/webhook/user', UserRouter)
app.use('/webhook/devices', DeviceRouter)
app.use('/webhook/notification', NotificationRouter)
app.use('/webhook/occurence', OccurenceRouter)
app.post('/webhook/parse/email', emailParser)
app.post('/webhook/authorize-request', authorizeRequest)

app.post('/event/print-label', printLabel)
app.post('/event/print-kot', printKOT)
app.post('/event/order/third-party', handleThirdPartyOrder)

app.post('/webhook/emails/handle-customer-signup', handleCustomerSignup)
app.post(
   '/webhook/emails/handle-subscription-cancelled',
   handleSubscriptionCancelled
)

app.use('/api/store', StoreRouter)

app.get('/images/:url(*)', handleImage)

app.use((_req, _res, next) => {
   const error = new Error('Not found')
   error.status = StatusCodes.NOT_FOUND
   next(error)
})

app.use((error, _req, res, next) => {
   res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
      ok: false,
      message: error.message,
      stack: error.stack
   })
})

app.listen(PORT, () => {
   console.log(`Server started on ${PORT}`)
})
