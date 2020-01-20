
const fs = require('fs')
const atob = require('atob')
const btoa = require('btoa')

module.exports = {
    containsNumber: function (myString) {
        return /\d/.test(myString)
    },
    containsSpace:  function (myString) {
        return /\s/.test(myString)
    },
    getFileExtension: function (filename) {
        return filename.split('.').pop()
    },
    jsonCopy: function (src) {
        return JSON.parse(JSON.stringify(src))
    },
    getConfigKey: function(key, config) {
        if (!config.hasOwnProperty(key)) {
            console.log('Unable to find key \'' + key + '\' in config file')
            process.exit()
        }
    
        return config[key]        
    },
    loadJsonFromDisk: function (path) {
        if (!fs.existsSync(path)) return null
        var file = fs.readFileSync(path, 'utf8')
        return JSON.parse(file)
    },
    loadXmlFromDisk: function (path) {
        if (!fs.existsSync(path)) return null
        return fs.readFileSync(path, 'utf8')
    },
    hashCode: function(string) {
        var hash = 0, i, chr
        if (string.length === 0) return hash
        for (i = 0; i < string.length; i++) {
          chr   = string.charCodeAt(i)
          hash  = ((hash << 5) - hash) + chr
          hash |= 0 // Convert to 32bit integer
        }
        return hash
      },
      encodeBase64: function(string) {
        //const Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/++[++^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
        //return Base64.encode(string);
        return btoa(string)
      },
      decodeBase64: function(string) {
        //const Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/++[++^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
        //return Base64.decode(string);
        return atob(string)
      },
    formatNumberLength: function (num, length) {
        var r = '' + num
        while (r.length < length) {
            r = '0' + r
        }
        return r
    },
    outputJsonToDisk: function (path, json, removeIFExists, prettify=true) {
        console.log('Outputting json to disk: ' + path)
        if (removeIFExists && fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
        if (prettify) {
            fs.writeFileSync(path, JSON.stringify(json, null, 4), 'utf8')
        } else {
            fs.writeFileSync(path, JSON.stringify(json), 'utf8')
        }
    },
    timeoutPromise: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },
    outputStringToDisk: function (path, string, removeIFExists) {
        console.log('Outputting string to disk: ' + path)
        if (removeIFExists && fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
        fs.writeFileSync(path, string, 'utf8')
    }
}