import axios from 'axios'

export const template_compiler = (text, data) => {
   try {
      const regex = /\{\{([^}]+)\}\}/g

      const evaluate = (path, data) =>
         path.split('.').reduce((o, i) => o[i], data)

      const matches = text.match(regex)

      const parsed = matches.map(match => {
         const key = match.slice(2, -2)
         const value = evaluate(key, data)
         return { [key]: value }
      })

      let obj = {}

      parsed.forEach(i => {
         obj = { ...obj, ...i }
      })

      const result = text.replace(regex, function (match) {
         return obj[match.slice(2, -2)]
      })
      return result
   } catch (error) {
      throw Error(error.message)
   }
}

export const getHtml = async (template, data) => {
   try {
      const parsed = JSON.parse(
         template_compiler(JSON.stringify(template), data)
      )
      const { origin } = new URL(process.env.DATA_HUB)
      const template_data = encodeURI(JSON.stringify(parsed.data))
      const template_options = encodeURI(JSON.stringify(parsed.template))

      const url = `${origin}/template/?template=${template_options}&data=${template_data}`

      const { data: html } = await axios.get(url)
      return html
   } catch (error) {
      throw Error(error.message)
   }
}
