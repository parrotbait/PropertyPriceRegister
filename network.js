const request = require('request')

module.exports = {
    get: function(url, expectsJson, headers) {
        return new Promise((resolve, reject) => {
            request.get({url:url, json:expectsJson, headers:headers}, (error, response, body) => { // eslint-disable-line no-unused-vars
                if (error) reject(error)
                if (response === undefined) {
                    reject('null')
                    return
                } 
                if (response.statusCode != 200) {
                    reject('Invalid status code <' + response.statusCode + '>')
                }
                resolve(body)
            })
        })
    }
}