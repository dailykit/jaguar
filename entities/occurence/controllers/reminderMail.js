import { client } from '../../../lib/graphql'
import { GET_CUSTOMERS_DETAILS } from '../graphql'
import { emailTrigger, autoGenerateCart, statusLogger } from '../../../utils'

export const reminderMail = async (req, res) => {
   console.log('recived request on reminder email')
   try {
      let payload
      if (typeof req.body.payload === 'string') {
         payload = JSON.parse(req.body.payload)
      } else {
         payload = req.body.payload
      }
      console.log('reminder payload', payload)
      const { subscriptionOccurenceId, hoursBefore } = payload
      const { subscriptionOccurences = [] } = await client.request(
         GET_CUSTOMERS_DETAILS,
         {
            id: subscriptionOccurenceId
         }
      )
      console.log(
         'fetched customers details and their detail for this particular occurence',
         { subscriptionOccurences }
      )

      if (subscriptionOccurences.length === 0) {
         console.log(
            `No customer subscribed to subscription that has subscriptionOccurenceId: ${subscriptionOccurenceId}`
         )
         return res.status(200).json({
            success: false,
            message: `No customer subscribed to subscription that has subscriptionOccurenceId: ${subscriptionOccurenceId}`
         })
      }

      const [occurence] = subscriptionOccurences
      const {
         subscription = {},
         settings: localSettings,
         subscriptionId
      } = occurence
      if (!subscriptionId)
         return res.status(200).json({
            success: false,
            message: `No subscription is linked to occurence id ${subscriptionOccurenceId}`
         })

      const { settings: globalSettings, brand_customers = [] } = subscription
      console.log({ brand_customers })
      if (
         globalSettings.isReminderEmail === false ||
         localSettings.isReminderEmail === false
      ) {
         console.log(`Reminder email functionality is disabled`)
         return res.status(200).json({
            success: true,
            message: `Reminder email functionality is disabled`
         })
      }

      if (brand_customers.length === 0) {
         console.log(
            `There are no brand customers yet linked to subscription id ${subscriptionId}`
         )
         return res.status(200).json({
            success: false,
            message: `There are no brand customers yet linked to subscription id ${subscriptionId}`
         })
      }

      const result = await Promise.all(
         brand_customers.map(async customer => {
            try {
               const {
                  id,
                  brandId,
                  keycloakId,
                  customerEmail,
                  isAutoSelectOptOut,
                  subscriptionOccurences = []
               } = customer
               console.log({ brand_customers_subscriptionOccurences: customer })

               await statusLogger({
                  keycloakId,
                  brand_customerId: id,
                  subscriptionOccurenceId,
                  type: 'Reminder Email',
                  message:
                     'Initiating reminder emails and auto product selection system.'
               })

               if (subscriptionOccurences.length === 0) {
                  console.log(
                     `No subscription customer linked with this brandCustomerId: ${id}.`
                  )
                  await autoGenerateCart({
                     keycloakId,
                     brand_customerId: id,
                     subscriptionOccurenceId,
                     hoursBefore,
                     brandId
                  })
                  return {
                     success: true,
                     message: 'auto generate cart',
                     data: { keycloakId, subscriptionOccurenceId }
                  }
               }

               const [occurence] = subscriptionOccurences
               const {
                  isAuto,
                  isSkipped,
                  cartId = null,
                  validStatus = {}
               } = occurence

               if (isSkipped) {
                  await statusLogger({
                     cartId,
                     keycloakId,
                     brand_customerId: id,
                     type: 'Reminder Email',
                     subscriptionOccurenceId,
                     message:
                        'Sent reminder email alerting customer that this week is skipped.'
                  })
                  await emailTrigger({
                     title: 'subscription-reminder-email',
                     variables: {
                        brandCustomerId: id,
                        subscriptionOccurenceId,
                        hoursBefore,
                        case: 'weekSkipped',
                        brandId
                     },
                     to: customerEmail.email,
                     brandId
                  })
                  return {
                     success: true,
                     data: { keycloakId, subscriptionOccurenceId },
                     message:
                        'Sent reminder email alerting customer that this week is skipped.'
                  }
               }

               if (isAuto) {
                  await statusLogger({
                     cartId,
                     keycloakId,
                     brand_customerId: id,
                     type: 'Reminder Email',
                     subscriptionOccurenceId,
                     message: `Sent reminder email for previously auto generated cart.`
                  })
                  await emailTrigger({
                     title: 'subscription-reminder-email',
                     variables: {
                        brandCustomerId: id,
                        subscriptionOccurenceId,
                        hoursBefore,
                        case: 'autoGenerateCart',
                        brandId
                     },
                     to: customerEmail.email,
                     brandId
                  })
                  return {
                     success: true,
                     data: { keycloakId, subscriptionOccurenceId },
                     message:
                        'Sent reminder email for previously auto generated cart.'
                  }
               }

               if (
                  cartId &&
                  'itemCountValid' in validStatus &&
                  validStatus.itemCountValid
               ) {
                  await statusLogger({
                     cartId,
                     keycloakId,
                     brand_customerId: id,
                     type: 'Reminder Email',
                     subscriptionOccurenceId,
                     message: `Sending reminder email for existing cart.`
                  })
                  await emailTrigger({
                     title: 'subscription-reminder-email',
                     variables: {
                        brandCustomerId: id,
                        subscriptionOccurenceId,
                        hoursBefore,
                        case: 'allSetCart',
                        brandId
                     },
                     to: customerEmail.email,
                     brandId
                  })
                  return {
                     success: true,
                     data: { keycloakId, subscriptionOccurenceId },
                     message: 'Sent reminder email for existing cart.'
                  }
               } else {
                  if (isAutoSelectOptOut) {
                     await statusLogger({
                        cartId,
                        keycloakId,
                        type: 'Reminder Email',
                        brand_customerId: id,
                        subscriptionOccurenceId,
                        message: `Brand customer has opted out of product auto selection.`
                     })
                     return {
                        success: true,
                        data: { keycloakId, subscriptionOccurenceId },
                        message:
                           'Brand customer has opted out of product auto selection.'
                     }
                  } else {
                     await autoGenerateCart({
                        keycloakId,
                        brand_customerId: id,
                        subscriptionOccurenceId,
                        hoursBefore,
                        brandId
                     })
                     return {
                        success: true,
                        message: 'auto generate cart',
                        data: { keycloakId, subscriptionOccurenceId }
                     }
                  }
               }
            } catch (error) {
               throw error
            }
         })
      )

      return res.status(200).json({
         success: true,
         data: result,
         message: 'Successfully sent the mail'
      })
   } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
   }
}
