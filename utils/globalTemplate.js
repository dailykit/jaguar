import { client } from '../lib/graphql'
import axios from 'axios'

const GET_STORE_SETTING = `
query GET_STORE_SETTING($brandId: Int!, $identifier: String!) {
   brands_brand_subscriptionStoreSetting(where: {brandId: {_eq: $brandId}, subscriptionStoreSetting: {identifier: {_eq: $identifier}}}) {
     brandId
     subscriptionStoreSettingId
     value
   }
 }
 `
const GET_FILE_PATH = `
query GET_FILE_PATH($id: Int!) {
   editor_file_by_pk(id: $id) {
     id
     path
   }
 }
 `

export const globalTemplate = async ({ brandId, identifier }) => {
   try {
      console.log({ brandId, identifier })
      const { brands_brand_subscriptionStoreSetting: settings } =
         await client.request(GET_STORE_SETTING, { brandId, identifier })
      console.log('before settings', settings)
      if (settings.length > 0) {
         console.log('inside settings', settings)
         const [setting] = settings
         const { editor_file_by_pk: file } = await client.request(
            GET_FILE_PATH,
            { id: setting.value.functionFileId }
         )
         const { origin } = new URL(process.env.DATA_HUB)
         const template_variables = encodeURI(JSON.stringify({ brandId }))

         const template_options = encodeURI(
            JSON.stringify({
               path: file.path,
               format: 'html'
            })
         )
         const url = `${origin}/template/?template=${template_options}&data=${template_variables}`
         const { data: html } = await axios.get(url)
         console.log('from util', html)
         return html
      }
      return null
   } catch (error) {
      throw error
   }
}
