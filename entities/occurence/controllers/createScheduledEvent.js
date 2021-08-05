import axios from 'axios'
import moment from 'moment'
import { get, isArray, isEmpty } from 'lodash'

import { client } from '../../../lib/graphql'
import { GET_REMINDER_SETTINGS } from '../graphql'

export const createScheduledEvent = async (req, res) => {
   try {
      let occurences = []

      if ('input' in req.body) {
         const { occurences: list = [] } = req.body.input
         occurences = list
      } else {
         const { id, cutoffTimeStamp } = req.body.event.data.new
         occurences.push({
            id: id,
            cutoffTimeStamp: cutoffTimeStamp
         })
      }

      const result = await Promise.all(
         occurences.map(async occurence => {
            try {
               const { subscriptionOccurences = [] } = await client.request(
                  GET_REMINDER_SETTINGS,
                  {
                     id: occurence.id
                  }
               )

               let hoursBefore = []
               if (subscriptionOccurences.length > 0) {
                  const hours = get(
                     subscriptionOccurences,
                     '[0].subscription.reminderSettings.hoursBefore'
                  )
                  if (isArray(hours) && !isEmpty(hours)) {
                     hoursBefore = hours
                  }
               }

               const url =
                  new URL(process.env.DATA_HUB).origin + '/datahub/v1/query'

               const timezone = moment()
                  .tz(process.env.TIMEZONE)
                  .toString()
                  .slice(-5)

               await axios({
                  url,
                  method: 'POST',
                  headers: {
                     'Content-Type': 'application/json',
                     'x-hasura-role': 'admin',
                     'x-hasura-admin-secret':
                        process.env.HASURA_GRAPHQL_ADMIN_SECRET
                  },
                  data: {
                     type: 'create_scheduled_event',
                     args: {
                        webhook:
                           new URL(process.env.DATA_HUB).origin +
                           '/server/webhook/occurence/manage',
                        schedule_at: occurence.cutoffTimeStamp + timezone,
                        payload: {
                           occurenceId: occurence.id,
                           cutoffTimeStamp: occurence.cutoffTimeStamp
                        },
                        headers: []
                     }
                  }
               })

               const dates = hoursBefore.map(item =>
                  moment(occurence.cutoffTimeStamp)
                     .subtract(item, 'hours')
                     .format('YYYY-MM-DD HH:mm:ss')
               )

               await Promise.all(
                  dates.map(async item => {
                     await axios({
                        url,
                        method: 'POST',
                        headers: {
                           'Content-Type': 'application/json',
                           'x-hasura-role': 'admin',
                           'x-hasura-admin-secret':
                              process.env.HASURA_GRAPHQL_ADMIN_SECRET
                        },
                        data: {
                           type: 'create_scheduled_event',
                           args: {
                              webhook:
                                 new URL(process.env.DATA_HUB).origin +
                                 '/server/webhook/occurence/reminder',
                              schedule_at: item + timezone,
                              payload: {
                                 subscriptionOccurenceId: occurence.id
                              },
                              headers: []
                           }
                        }
                     })
                  })
               )
               return {
                  success: true,
                  data: occurence,
                  message: 'Successfully created events!'
               }
            } catch (error) {
               return { success: false, message: error.message }
            }
         })
      )

      return res.status(200).json({
         data: result,
         success: true,
         message: 'Successfully created scheduled events and reminders!'
      })
   } catch (error) {
      return res.status(200).json({
         success: false,
         error: error.message,
         message: 'Failed to create scheduled event'
      })
   }
}
