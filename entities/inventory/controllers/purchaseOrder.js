import { StatusCodes } from 'http-status-codes'
import { client } from '../../../lib/graphql'
import {
   CREATE_BULK_ITEM_HISTORY,
   CREATE_PACKAGING_HISTORY,
   UPDATE_BULK_ITEM_HISTORIES_WITH_PURCHASE_ORDER_ID
} from '../graphql/mutations'
import {
   GET_BULK_ITEM_HISTORIES_WITH_PURCHASE_ORDER_ID,
   GET_PACKAGING_HISTORY
} from '../graphql/queries'
import { updatePackagingHistoryStatus } from './utils'
// Done
// test -> passes for bulk item. packaging pending...
export const handlePurchaseOrderCreateUpdate = async (req, res, next) => {
   try {
      const {
         id,
         bulkItemId,
         orderQuantity,
         status,
         unit,
         packagingId
      } = req.body.event.data.new

      if (status === 'UNPUBLISHED') {
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'purchase order not published yet.'
         })
         return
      }

      // if the order is for packaging
      if (packagingId) {
         handlePackagingPurchaseOrders(req, res)
         return
      }

      const { bulkItemHistories = [] } = await client.request(
         GET_BULK_ITEM_HISTORIES_WITH_PURCHASE_ORDER_ID,
         {
            id
         }
      )

      if (bulkItemHistories.length) {
         // update history
         await client.request(
            UPDATE_BULK_ITEM_HISTORIES_WITH_PURCHASE_ORDER_ID,
            { id, set: { status } }
         )

         res.status(StatusCodes.OK).json({
            ok: true,
            message: `bulk item history marked ${status}`
         })
         return
      } else {
         // create history
         await client.request(CREATE_BULK_ITEM_HISTORY, {
            objects: [
               {
                  bulkItemId,
                  quantity: orderQuantity,
                  unit,
                  status: 'PENDING',
                  purchaseOrderItemId: id
               }
            ]
         })
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'bulk item history created'
         })
         return
      }
   } catch (error) {
      next(error)
   }
}

async function handlePackagingPurchaseOrders(req, res) {
   const { id, orderQuantity, status, packagingId } = req.body.event.data.new

   const {
      inventory_packagingHistory: packagingHistories = []
   } = await client.request(GET_PACKAGING_HISTORY, { id })

   if (!packagingHistories.length) {
      await client.request(CREATE_PACKAGING_HISTORY, {
         object: {
            packagingId,
            quantity: orderQuantity,
            purchaseOrderItemId: id
         }
      })
      res.status(StatusCodes.CREATED).json({
         ok: true,
         message: 'packaging history created.'
      })
      return
   } else {
      // update the packagingHistory's status
      await updatePackagingHistoryStatus(id, status)
      res.status(StatusCodes.OK).json({
         ok: true,
         message: `status updated to ${status}`
      })
      return
   }
}
