var exec = require('child_process').exec

module.exports = {
    runCommand: async function(command) {
        return new Promise((resolve, reject) => {
            exec(command, function(err, stdout, stderr) {
                if(err != null) {
                    return reject(err)
                } else if(typeof(stderr) != 'string') {
                    return reject(stderr)
                } else {
                    return resolve(stdout)
                }
            })
        })
    }
}