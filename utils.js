const fs = require('fs')
const atob = require('atob')
const btoa = require('btoa')

module.exports = {
  containsNumber(myString) {
    return /\d/.test(myString)
  },
  containsSpace(myString) {
    return /\s/.test(myString)
  },
  getFileExtension(filename) {
    return filename.split('.').pop()
  },
  jsonCopy(src) {
    return JSON.parse(JSON.stringify(src))
  },
  loadJsonFromDisk(path) {
    if (!fs.existsSync(path)) return null
    const file = fs.readFileSync(path, 'utf8')
    return JSON.parse(file)
  },
  loadXmlFromDisk(path) {
    if (!fs.existsSync(path)) return null
    return fs.readFileSync(path, 'utf8')
  },
  encodeBase64(string) {
    return btoa(string)
  },
  decodeBase64(string) {
    return atob(string)
  },
  timeoutPromise(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
