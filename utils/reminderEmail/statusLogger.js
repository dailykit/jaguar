import { client } from '../../lib/graphql'

export const statusLogger = async ({
   message = '',
   type = '',
   keycloakId = null,
   cartId = null,
   brand_customerId = null,
   subscriptionOccurenceId = null
}) => {
   await client.request(INSERT_ACTIVITY_LOGS, {
      objects: [
         {
            type,
            log: { message },
            ...(cartId && { cartId }),
            ...(keycloakId && { keycloakId }),
            ...(brand_customerId && { brand_customerId }),
            ...(subscriptionOccurenceId && { subscriptionOccurenceId }),
            updated_by: {
               type: 'auto',
               message
            }
         }
      ]
   })
}

const INSERT_ACTIVITY_LOGS = `
   mutation insertActivityLogs(
      $objects: [settings_activityLogs_insert_input!]!
   ) {
      insertActivityLogs: insert_settings_activityLogs(objects: $objects) {
         affected_rows
      }
   }
`
