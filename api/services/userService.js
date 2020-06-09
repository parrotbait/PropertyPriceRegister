class UserService {
  constructor(userModel) {
    this.userModel = userModel
  }

  static get relationMappings() {
    return {
      token: {
        relation: Model.HasOneRelation,
        modelClass: Token,
        join: {
          from: 'properties.tokens',
          to: 'user.access_key'
        }
      }
    }
  }

  async add(params) {
    return await this.userModel.query().insert({
      first_name: params.first_name,
      second_name: params.second_name,
      email: params.email,
      access_key: params.access_key,
      access_secret: params.access_secret
    })
  }

  async fetchOne(params) {
    const query = this.userModel
      .query()
      .select(
        'id', 'uuid', 'first_name', 'second_name', 'email', 'access_key', 'access_secret'
      )

    if (params.email) {
      query.where('email',  params.email)
    }
    if (params.id) {
      query.where('id',  params.id)
    }
    if (params.access_key) {
      query.where('access_key',  params.access_key)

      if (params.access_secret) {
        query.where('access_secret',  params.access_secret)
      }
    }
    query.where('activated', params.allow_inactive || true)
    return query
  }
}

exports.UserService = UserService
