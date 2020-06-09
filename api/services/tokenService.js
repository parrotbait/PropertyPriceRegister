const moment = require('moment')

class TokenService {
  constructor(tokenModel) {
    this.tokenModel = tokenModel
    this.expiration_seconds = 3600
  }

  async save(params) {
    const now = moment(new Date())
    const expiration = now.clone().add(this.expiration_seconds, 'seconds')
    return this.tokenModel
      .query()
      .insert({
        access_token: params.access_token,
        access_key: params.access_key,
        start_date: now.format("YYYY-MM-DD HH:mm:ss"),
        end_date: expiration.format("YYYY-MM-DD HH:mm:ss")
      })
  }

  async fetchOne(params) {
    const query = this.tokenModel
    .query()
    .orderBy('end_date', 'desc')
    .first()

    if (params.access_key) {
      query.where({ access_key: params.access_key })
    }
    if (params.access_token) {
      query.where({ access_token: params.access_token })
    }
    if (!params.show_inactive) {
      query.where('end_date', '>', moment(new Date()).format("YYYY-MM-DD HH:mm:ss"))
    }
    return query
  }
}

exports.TokenService = TokenService
