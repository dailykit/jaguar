export const GET_BULK_ITEM = `
   query BulkItem($id: Int!) {
      bulkItem(id: $id) {
         unit
         onHand
         awaiting
         committed
         consumed
      }
   }
`

export const GET_BULK_ITEM_WITH_CONVERSIONS = `
   query BulkItem($id: Int!, $from: String!, $to: String!, $quantity: numeric!) {
      bulkItem(id: $id) {
         unit
         unit_conversions(args : { from_unit : $from, to_unit : $to, from_unit_bulk_density : -1, to_unit_bulk_density : -1, quantity : $quantity }) {
            data
         }
      }
   }
`

export const GET_SACHET_ITEM = `
   query SachetItem($id: Int!) {
      sachetItem(id: $id) {
         awaiting
         consumed
         onHand
         committed
      }
   }
`

export const GET_BULK_ITEM_HISTORIES_WITH_BULK_WORK_ORDER_ID = `
   query BulkItemHistories ($bulkWorkOrderId: Int!){
      bulkItemHistories(where: {bulkWorkOrderId: {_eq: $bulkWorkOrderId}}) {
         id
         status
         quantity
      }
   }
`

export const GET_BULK_ITEM_HISTORIES_WITH_SACHET_WORK_ORDER_ID = `
   query BulkItemHistories ($sachetWorkOrderId: Int!){
      bulkItemHistories(where: {sachetWorkOrderId: {_eq: $sachetWorkOrderId}}) {
         id
         status
         quantity
      }
   }
`
export const GET_BULK_ITEM_HISTORIES_WITH_PURCHASE_ORDER_ID = `
   query BulkItemHistories($id: Int!) {
      bulkItemHistories(where: { purchaseOrderItemId: { _eq: $id } }) {
         id
         status
         quantity
      }
   }
`

export const GET_SACHET_ITEM_HISTORIES = `
   query SachetItemHistories ($sachetWorkOrderId: Int!){
   sachetItemHistories(where: {sachetWorkOrderId: {_eq: $sachetWorkOrderId}}) {
      id
      quantity
      status
   }
}
`
export const GET_PACKAGING = `
   query Packaging($id: Int!) {
      packaging(id: $id) {
         onHand
         awaiting
         committed
         consumed
      }
   }
`
export const GET_PACKAGING_HISTORY = `
   query GetPackagingHistory($id: Int!) {
      inventory_packagingHistory(where: { purchaseOrderItemId: { _eq: $id } }) {
         id
         status
      }
   }
`
