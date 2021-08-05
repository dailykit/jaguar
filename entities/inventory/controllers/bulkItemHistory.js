import { StatusCodes } from 'http-status-codes'
import { client } from '../../../lib/graphql'
import {
   UPDATE_BULK_ITEM,
   UPDATE_BULK_ITEM_HISTORY_WITH_ID
} from '../graphql/mutations'
import {
   GET_BULK_ITEM,
   GET_BULK_ITEM_WITH_CONVERSIONS
} from '../graphql/queries'
import { getCalculatedValue } from './utils'

// Done
// test -> passes
export const handleBulkItemHistory = async (req, res, next) => {
   try {
      const { bulkItemId, quantity, status, unit, id } = req.body.event.data.new
      const oldBulkItem = req.body.event.data.old

      const isReducing = quantity < 0

      // fetch the bulkItem (with id === bulkItemId)
      const bulkItemData = await client.request(GET_BULK_ITEM, {
         id: bulkItemId
      })

      const { bulkItem: bulkItemWithConversions } = await client.request(
         GET_BULK_ITEM_WITH_CONVERSIONS,
         {
            id: bulkItemId,
            from: unit,
            to: bulkItemData.bulkItem.unit,
            quantity: Math.abs(quantity)
         }
      )

      console.log(bulkItemWithConversions)

      // handle unit conversion
      const [conversions] = bulkItemWithConversions.unit_conversions

      const { error, value: calculatedQuantity } = getCalculatedValue(
         unit,
         bulkItemData.bulkItem.unit,
         conversions.data.result,
         Math.abs(quantity)
      )

      if (error) {
         console.log(error)
         await client.request(UPDATE_BULK_ITEM_HISTORY_WITH_ID, {
            id,
            set: {
               isResolved: false
            }
         })
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'Failed to resolve units!'
         })
         return
      }

      // conversion found
      await client.request(UPDATE_BULK_ITEM_HISTORY_WITH_ID, {
         id,
         set: {
            isResolved: true
         }
      })

      if (
         status === 'CANCELLED' &&
         oldBulkItem &&
         oldBulkItem.status === 'PENDING'
      ) {
         if (isReducing) {
            // set bulkItem's committed -> - |quantity|
            await client.request(UPDATE_BULK_ITEM, {
               where: { id: { _eq: bulkItemId } },
               set: {
                  committed:
                     bulkItemData.bulkItem.committed -
                     Math.abs(calculatedQuantity)
               }
            })
            res.status(StatusCodes.OK).json({
               ok: true,
               message: 'bulk item updated'
            })
            return
         }

         if (!isReducing) {
            // set bulkItem's awaiting -> - |quantity|
            await client.request(UPDATE_BULK_ITEM, {
               where: { id: { _eq: bulkItemId } },
               set: {
                  awaiting:
                     bulkItemData.bulkItem.awaiting -
                     Math.abs(calculatedQuantity)
               }
            })
            res.status(StatusCodes.OK).json({
               ok: true,
               message: 'bulk item updated'
            })
            return
         }
      }

      if (
         status === 'CANCELLED' &&
         oldBulkItem &&
         oldBulkItem.status === 'COMPLETED'
      ) {
         if (isReducing) {
            // set bulkItem's committed -> - |quantity|
            await client.request(UPDATE_BULK_ITEM, {
               where: { id: { _eq: bulkItemId } },
               set: {
                  onHand:
                     bulkItemData.bulkItem.onHand +
                     Math.abs(calculatedQuantity),
                  consumed:
                     bulkItemData.bulkItem.consumed -
                     Math.abs(calculatedQuantity)
               }
            })
            res.status(StatusCodes.OK).json({
               ok: true,
               message: 'bulk item updated'
            })
            return
         }

         if (!isReducing) {
            await client.request(UPDATE_BULK_ITEM, {
               where: { id: { _eq: bulkItemId } },
               set: {
                  onHand:
                     bulkItemData.bulkItem.onHand - Math.abs(calculatedQuantity)
               }
            })
            res.status(StatusCodes.OK).json({
               ok: true,
               message: 'bulk item updated'
            })
            return
         }
      }

      if (
         status === 'PENDING' &&
         oldBulkItem &&
         oldBulkItem.status === 'COMPLETED'
      ) {
         if (!isReducing) {
            await client.request(UPDATE_BULK_ITEM, {
               where: { id: { _eq: bulkItemId } },
               set: {
                  onHand:
                     bulkItemData.bulkItem.onHand -
                     Math.abs(calculatedQuantity),
                  awaiting:
                     bulkItemData.bulkItem.awaiting +
                     Math.abs(calculatedQuantity)
               }
            })
            res.status(StatusCodes.OK).json({
               ok: true,
               message: 'bulk item updated'
            })
            return
         }

         if (isReducing) {
            await client.request(UPDATE_BULK_ITEM, {
               where: { id: { _eq: bulkItemId } },
               set: {
                  onHand:
                     bulkItemData.bulkItem.onHand +
                     Math.abs(calculatedQuantity),
                  consumed:
                     bulkItemData.bulkItem.consumed -
                     Math.abs(calculatedQuantity),
                  committed:
                     bulkItemData.bulkItem.committed +
                     Math.abs(calculatedQuantity)
               }
            })
            res.status(StatusCodes.OK).json({
               ok: true,
               message: 'bulk item updated'
            })
            return
         }
      }

      if (status === 'PENDING' && isReducing) {
         // update bulkItem's commited field -> +|quantity|
         await client.request(UPDATE_BULK_ITEM, {
            where: { id: { _eq: bulkItemId } },
            set: {
               committed:
                  bulkItemData.bulkItem.committed + Math.abs(calculatedQuantity)
            }
         })
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'bulk item updated'
         })
         return
      }

      if (status === 'COMPLETED' && isReducing) {
         // set bulkItem' commited -> - |quantity|
         //               on-hand -> - |quantity|
         //               consumed -> + |quantity|

         await client.request(UPDATE_BULK_ITEM, {
            where: { id: { _eq: bulkItemId } },
            set: {
               committed:
                  bulkItemData.bulkItem.committed -
                  Math.abs(calculatedQuantity),
               onHand:
                  bulkItemData.bulkItem.onHand - Math.abs(calculatedQuantity),
               consumed:
                  bulkItemData.bulkItem.consumed + Math.abs(calculatedQuantity)
            }
         })
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'bulk item updated'
         })

         return
      }

      if (status === 'PENDING' && !isReducing) {
         // set bulkItem's awaiting -> + |quantity|
         await client.request(UPDATE_BULK_ITEM, {
            where: { id: { _eq: bulkItemId } },
            set: {
               awaiting:
                  bulkItemData.bulkItem.awaiting + Math.abs(calculatedQuantity)
            }
         })
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'bulk item updated'
         })
         return
      }

      if (status === 'COMPLETED' && !isReducing) {
         // set bulkItem's onHand -> + |quantity|
         // set bulkItem's awaiting -> - |awaiting|

         await client.request(UPDATE_BULK_ITEM, {
            where: { id: { _eq: bulkItemId } },
            set: {
               awaiting:
                  bulkItemData.bulkItem.awaiting - Math.abs(calculatedQuantity),
               onHand:
                  bulkItemData.bulkItem.onHand + Math.abs(calculatedQuantity)
            }
         })
         res.status(StatusCodes.OK).json({
            ok: true,
            message: 'bulk item updated'
         })
         return
      }
   } catch (error) {
      console.log(error)
      next(error)
   }
}
