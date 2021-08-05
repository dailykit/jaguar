import axios from 'axios'
import { client } from '../../lib/graphql'
import { template_compiler } from '..'
import { SEND_MAIL } from '../../entities/occurence/graphql'

export const emailTrigger = async ({ title, variables = {}, to }) => {
   try {
      const { templateSettings = [] } = await client.request(
         GET_TEMPLATE_SETTINGS,
         {
            title
         }
      )
      if (templateSettings.length === 1) {
         const [
            {
               requiredVar = [],
               subjectLineTemplate,
               fromEmail,
               functionFile = {},
               emailTemplateFile = {}
            }
         ] = templateSettings

         let proceed = true
         requiredVar.every(item => {
            proceed = variables.hasOwnProperty(item)
            return proceed
         })
         if (proceed) {
            let html = await getHtml(
               functionFile,
               emailTemplateFile.fileName,
               variables
            )
            let subjectLine = await getHtml(
               functionFile,
               emailTemplateFile.fileName,
               variables,
               subjectLineTemplate
            )

            await client.request(SEND_MAIL, {
               emailInput: {
                  from: fromEmail,
                  to,
                  subject: subjectLine,
                  attachments: [],
                  html
               }
            })
         } else {
            console.log(
               'Could not send email as required variables were not provided'
            )
         }
      }
   } catch (error) {
      console.log(error)
      return {
         success: false,
         message: 'Failed to send email.',
         error: error.message
      }
   }
}

const getHtml = async (
   functionFile,
   emailTemplateFileName,
   variables,
   subjectLineTemplate
) => {
   try {
      const { origin } = new URL(process.env.DATA_HUB)
      const template_variables = encodeURI(JSON.stringify(variables))
      if (subjectLineTemplate) {
         const template_options = encodeURI(
            JSON.stringify({
               path: functionFile.path,
               emailTemplateFileName,
               format: 'html',
               readVar: true
            })
         )
         const url = `${origin}/template/?template=${template_options}&data=${template_variables}`
         const { data } = await axios.get(url)
         const result = template_compiler(subjectLineTemplate, data)
         return result
      } else {
         const template_options = encodeURI(
            JSON.stringify({
               path: functionFile.path,
               emailTemplateFileName,
               format: 'html'
            })
         )
         const url = `${origin}/template/?template=${template_options}&data=${template_variables}`
         const { data: html } = await axios.get(url)
         return html
      }
   } catch (error) {
      throw error
   }
}

export const GET_TEMPLATE_SETTINGS = `
   query templateSettings($title: String!) {
      templateSettings: notifications_emailTriggers(
         where: { title: { _eq: $title } }
      ) {
         id
         title
         requiredVar: var
         subjectLineTemplate
         functionFile {
            fileName
            path
         }
         emailTemplateFile {
            fileName
            path
         }
         fromEmail
      }
   }
`
