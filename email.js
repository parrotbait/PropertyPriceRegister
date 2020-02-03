
const nodemailer = require('nodemailer')
const utils = require('./utils')

async function sendEmailInternal(processed, log) {
    const emailFrom = process.env.EMAIL_FROM
    const emailTo = process.env.EMAIL_TO
    const fromPw = process.env.EMAIL_PASSWORD
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
    sendEmail: async function(processed, log) {
        await sendEmailInternal(processed, log).catch((err) => {
            console.log(err)
            process.exit()
        })
        await utils.timeoutPromise(10000)
    }
}