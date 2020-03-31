const nodemailer = require('nodemailer')
const utils = require('./utils')

async function sendEmailInternal(processed, log) {
  const emailFrom = process.env.EMAIL_FROM
  const emailTo = process.env.EMAIL_TO
  const fromPw = process.env.EMAIL_PASSWORD
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: emailFrom,
      pass: fromPw
    }
  })

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: `PPR Processing - ${processed} processed`,
    text: log
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error)
        reject(error)
      } else {
        console.log(`Email sent: ${info.response}`)
        resolve()
      }
    })
  })
}

module.exports = {
  async sendEmail(processed, log) {
    await sendEmailInternal(processed, log).catch(err => {
      console.log(err)
      process.exit()
    })
    await utils.timeoutPromise(10000)
  }
}
