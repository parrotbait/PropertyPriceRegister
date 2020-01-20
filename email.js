
const nodemailer = require('nodemailer')
const utils = require('./utils')

async function sendEmailInternal(config, processed, log) {
    const emailFrom = utils.getConfigKey('email_from', config)
    const emailTo = utils.getConfigKey('email_to', config)
    const fromPw = utils.getConfigKey('email_password', config)
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailFrom,
            pass: fromPw
        }
    })

    let mailOptions = {
        from: emailFrom,
        to: emailTo,
        subject: 'PPR Processing - ' + processed + ' processed',
        text: log
    }

    return new Promise((resolve, reject) => { 
        transporter.sendMail(mailOptions, function(error, info){
            console.log('5')
            if (error) {
              console.log(error)
              reject(error)
            } else {
              console.log('Email sent: ' + info.response)
              resolve()
            }
          })
    })
}

module.exports = {
    sendEmail: async function(config, processed, log) {
        await sendEmailInternal(config, processed, log).catch((err) => {
            console.log(err)
            process.exit()
        })
        await utils.timeoutPromise(10000)
    }
}