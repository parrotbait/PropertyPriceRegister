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
  },
  mysql_real_escape_string(str) {
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(char) {
      switch (char) {
        case '\0':
          return `\0`
        case "\x08":
          return "\\b"
        case "\x09":
          return "\\t"
        case "\x1a":
          return "\\z"
        case "\n":
          return "\\n"
        case "\r":
          return "\\r"
        case '"':
        case "'":
        case '\\':
        case '%':
          return `'${char}` // prepends a backslash to backslash, percent,
        // and double/single quotes
        default:
          return char
      }
    })
}
}
