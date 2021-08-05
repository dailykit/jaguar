export const CREATE_SACHET_ITEM_HISTORY = `
   mutation CreatSachetItemHistory ($objects: [inventory_sachetItemHistory_insert_input!]!) {
      createSachetItemHistory (objects: $objects) {
         returning {
            id
         }
      }
   }
`

export const UPDATE_SACHET_ITEM_HISTORY_WITH_SACHET_WORK_ORDER_ID = `
   mutation UpdateSachetItemHistory(
      $sachetWorkOrderId: Int!
      $set: inventory_sachetItemHistory_set_input!
   ) {
      updateSachetItemHistory(
         where: { sachetWorkOrderId: { _eq: $sachetWorkOrderId } }
         _set: $set
      ) {
         affected_rows
      }
   }
`

export const UPDATE_SACHET_ITEM_HISTORY = `
   mutation UpdateSachetItemHistory(
      $where: inventory_sachetItemHistory_bool_exp!
      $set: inventory_sachetItemHistory_set_input!
   ) {
      updateSachetItemHistory(
         where: $where
         _set: $set
      ) {
         affected_rows
      }
   }
`

export const CREATE_BULK_ITEM_HISTORY = `
   mutation CreateBulkItemHistory(
      $objects: [inventory_bulkItemHistory_insert_input!]!
   ) {
      createBulkItemHistory(
         objects: $objects
      ) {
         returning {
            id
         }
      }
   }                 
`

export const CREATE_BULK_ITEM_HISTORY_FOR_BULK_WORK_ORDER = `
   mutation CreateBulkItemHistory(
      $bulkItemId: Int!
      $quantity: numeric!
      $status: String!
      $unit: String!
      $bulkWorkOrderId: Int!
   ) {
      createBulkItemHistory(
         objects: {
            bulkItemId: $bulkItemId
            quantity: $quantity
            status: $status
            unit: $unit
            bulkWorkOrderId: $bulkWorkOrderId
         }
      ) {
         returning {
            id
         }
      }
   }
`

export const UPDATE_BULK_ITEM = `
   mutation UpdateBulkItem ($where: inventory_bulkItem_bool_exp!, $set: inventory_bulkItem_set_input){
      updateBulkItem (where: $where, _set: $set) {
      affected_rows 
      returning {
         id
      }
      }
   }
`
export const UPDATE_BULK_ITEM_HISTORY = `
   mutation UpdateBulkItemHistory($bulkItemId: Int!, $set: inventory_bulkItemHistory_set_input) {
      updateBulkItemHistory(where: {bulkItemId:{_eq: $bulkItemId}}, _set: $set) {
         affected_rows
         returning {
            id
         }
      }
   }
`

export const UPDATE_BULK_ITEM_HISTORY_WITH_ID = `
   mutation UpdateBulkItemHistory($id: Int!, $set: inventory_bulkItemHistory_set_input) {
      updateBulkItemHistory(where: {id :{_eq: $id}}, _set: $set) {
         affected_rows
         returning {
            id
         }
      }
   }
`

export const UPDATE_BULK_ITEM_HISTORIES_WITH_BULK_WORK_ORDER_ID = `
   mutation UpdateBulkItemHistory ($bulkWorkOrderId: Int!, $set: inventory_bulkItemHistory_set_input) {
      updateBulkItemHistory(
         where: { bulkWorkOrderId: { _eq: $bulkWorkOrderId } }
         _set: $set
      ) {
         affected_rows
      }
   }
`

export const UPDATE_BULK_ITEM_HISTORY_WITH_SACHET_ORDER_ID = `
   mutation UpdateBulkItemHistory ($sachetWorkOrderId: Int!, $set: inventory_bulkItemHistory_set_input) {
      updateBulkItemHistory(
         where: { sachetWorkOrderId: { _eq: $sachetWorkOrderId } }
         _set: $set
      ) {
         affected_rows
      }
   }
`
export const UPDATE_BULK_ITEM_HISTORIES_WITH_PURCHASE_ORDER_ID = `
   mutation UpdateBulkItemHistory(
      $set: inventory_bulkItemHistory_set_input
      $id: Int!
   ) {
      updateBulkItemHistory(
         _set: $set
         where: { purchaseOrderItemId: { _eq: $id } }
      ) {
         affected_rows
      }
   }
`

export const UPDATE_SACHET_ITEM = `
   mutation UpdateSachetItem(
      $where: inventory_sachetItem_bool_exp!
      $set: inventory_sachetItem_set_input
   ) {
      updateSachetItem(where: $where, _set: $set) {
         affected_rows
         returning {
            id
         }
      }
   }
`

export const CREATE_PACKAGING_HISTORY = `
   mutation CreatePackagingHistory(
      $object: inventory_packagingHistory_insert_input!
   ) {
      insert_inventory_packagingHistory_one(object: $object) {
         id
      }
   }
`

export const UPDATE_PACKAGING_HISTORY = `
   mutation UpdatePackagingHistory(
      $set: inventory_packagingHistory_set_input
      $id: Int!
   ) {
      update_inventory_packagingHistory(
         _set: $set
         where: { purchaseOrderItemId: { _eq: $id } }
      ) {
         affected_rows
      }
   }
`

export const UPDATE_PACKAGING = `
   mutation UpdatePackaging($packagingId: Int!, $set: packaging_packaging_set_input) {
      updatePackaging(where: { id: { _eq: $packagingId } }, _set: $set) {
         affected_rows
      }
   }
`
