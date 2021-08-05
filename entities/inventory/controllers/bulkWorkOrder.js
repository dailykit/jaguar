import { StatusCodes } from 'http-status-codes'
import { client } from '../../../lib/graphql'
import {
   CREATE_BULK_ITEM_HISTORY_FOR_BULK_WORK_ORDER,
   UPDATE_BULK_ITEM_HISTORIES_WITH_BULK_WORK_ORDER_ID
} from '../graphql/mutations'
import {
   GET_BULK_ITEM_HISTORIES_WITH_BULK_WORK_ORDER_ID,
   GET_BULK_ITEM
} from '../graphql/queries'
import { getCalculatedValue } from './utils'

// Done
// test -> passes -> finally
export const handleBulkWorkOrderCreateUpdate = async (req, res, next) => {
   try {
      const {
         id: bulkWorkOrderId,
         inputBulkItemId,
         outputBulkItemId,
         inputQuantity,
         outputQuantity,
         status
      } = req.body.event.data.new

      if (status === 'UNPUBLISHED') {
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'work order not published yet.'
         })
         return
      }

      // fetch the bulkItemHistory (2) usin bulkWorkOrderId [length 2]
      // will return an array of length 2
      const bulkItemHistories = await client.request(
         GET_BULK_ITEM_HISTORIES_WITH_BULK_WORK_ORDER_ID,
         {
            bulkWorkOrderId
         }
      )

      if (
         bulkItemHistories &&
         bulkItemHistories.bulkItemHistories &&
         bulkItemHistories.bulkItemHistories.length
      ) {
         // mark the [bulkItemHistory].length = 2 -> COMPLETE or CANCELLED
         await client.request(
            UPDATE_BULK_ITEM_HISTORIES_WITH_BULK_WORK_ORDER_ID,
            {
               bulkWorkOrderId,
               set: { status }
            }
         )
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'histories updated'
         })
      } else {
         const { bulkItem: inputBulkItem } = await client.request(
            GET_BULK_ITEM,
            {
               id: inputBulkItemId
            }
         )

         const { bulkItem: outputBulkItem } = await client.request(
            GET_BULK_ITEM,
            {
               id: outputBulkItemId
            }
         )

         // create 2 bulkItemHistory for input and for output
         await client.request(CREATE_BULK_ITEM_HISTORY_FOR_BULK_WORK_ORDER, {
            bulkItemId: outputBulkItemId,
            quantity: outputQuantity,
            status: 'PENDING',
            unit: outputBulkItem.unit,
            bulkWorkOrderId: bulkWorkOrderId
         })

         await client.request(CREATE_BULK_ITEM_HISTORY_FOR_BULK_WORK_ORDER, {
            bulkItemId: inputBulkItemId,
            quantity: -inputQuantity, // this should be calculated
            unit: inputBulkItem.unit,
            status: 'PENDING',
            bulkWorkOrderId: bulkWorkOrderId
         })
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'histories created'
         })
      }
   } catch (error) {
      console.log(error)
      next(error)
   }
}
