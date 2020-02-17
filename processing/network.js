const request = require('request')

module.exports = {
  get(url, expectsJson, headers) {
    return new Promise((resolve, reject) => {
      request.get(
        { url, json: expectsJson, headers },
        (error, response, body) => {
          // eslint-disable-line no-unused-vars
          if (error) reject(error)
          if (response === undefined) {
            return reject(new Error('null'))
          }
          if (response.statusCode !== 200) {
            return reject(
              new Error(`Invalid status code <${response.statusCode}>`)
            )
          }
          return resolve(body)
        }
      )
    })
  }
}
