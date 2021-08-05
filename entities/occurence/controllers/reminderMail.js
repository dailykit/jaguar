import { client } from '../../../lib/graphql'
import { GET_CUSTOMERS_DETAILS } from '../graphql'
import { emailTrigger, autoGenerateCart, statusLogger } from '../../../utils'

export const reminderMail = async (req, res) => {
   try {
      const { subscriptionOccurenceId } = req.body.payload
      const { subscriptionOccurences = [] } = await client.request(
         GET_CUSTOMERS_DETAILS,
         {
            id: subscriptionOccurenceId
         }
      )

      if (subscriptionOccurences.length === 0)
         return res.status(200).json({
            success: false,
            message: `No subscription occurence linked to id ${subscriptionOccurenceId}`
         })

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

      if (
         globalSettings.isReminderEmail === false ||
         localSettings.isReminderEmail === false
      )
         return res.status(200).json({
            success: true,
            message: `Reminder email functionality is disabled`
         })

      if (brand_customers.length === 0)
         return res.status(200).json({
            success: false,
            message: `There are no brand customers yet linked to subscription id ${subscriptionId}`
         })

      const result = await Promise.all(
         brand_customers.map(async customer => {
            try {
               const {
                  id,
                  keycloakId,
                  customerEmail,
                  isAutoSelectOptOut,
                  subscriptionOccurences = []
               } = customer

               await statusLogger({
                  keycloakId,
                  brand_customerId: id,
                  subscriptionOccurenceId,
                  type: 'Reminder Email',
                  message:
                     'Initiating reminder emails and auto product selection system.'
               })

               if (subscriptionOccurences.length === 0)
                  return {
                     success: false,
                     data: { keycloakId, subscriptionOccurenceId },
                     message:
                        'No subscription customer linked with this brand customer.'
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
                     title: 'weekSkipped',
                     variables: {
                        brandCustomerId: id,
                        subscriptionOccurenceId
                     },
                     to: customerEmail.email
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
                     title: 'autoGenerateCart',
                     variables: {
                        brandCustomerId: id,
                        subscriptionOccurenceId
                     },
                     to: customerEmail.email
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
                     title: 'allSetCart',
                     variables: {
                        brandCustomerId: id,
                        subscriptionOccurenceId
                     },
                     to: customerEmail.email
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
                        subscriptionOccurenceId
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
