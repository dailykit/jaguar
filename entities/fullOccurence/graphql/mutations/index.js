export const CREATE_SUBSCRIPTION_OCCURENCE = `
mutation CreateSubscriptionOccurence($objects: [subscription_subscriptionOccurence_customer_insert_input!]!) {
    insert_subscription_subscriptionOccurence_customer(objects: $objects) {
      affected_rows
    }
  }`
