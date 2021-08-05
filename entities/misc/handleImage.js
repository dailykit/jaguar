import fs from 'fs'
import path from 'path'
import request from 'request'

const download = function (uri, filename, callback) {
   try {
      request.head(uri, (err, res, body) => {
         try {
            if (err) throw err
            request(uri)
               .pipe(fs.createWriteStream(__dirname + '/' + filename))
               .on('close', callback)
               .on('error', error => {
                  throw error
               })
         } catch (error) {
            throw error
         }
      })
   } catch (error) {
      return error
   }
}

export const handleImage = (req, res) => {
   try {
      const { url } = req.params
      const original = new URL(url)
      const name =
         path
            .dirname(url)
            .replace(original.protocol + '//', '')
            .replace(/\./g, '-')
            .replace(/\//g, '-') +
         '-' +
         path.basename(url).replace(path.extname(url), '').replace(/ /g, '-') +
         path.extname(url)

      const basePath = __dirname + '/' + name

      if (fs.existsSync(basePath)) {
         return res.sendFile(basePath)
      }

      download(original.origin + original.pathname, name, async () => {
         res.sendFile(basePath)
      })
   } catch (error) {
      console.log(error)
      return res.json({ success: false })
   }
}
