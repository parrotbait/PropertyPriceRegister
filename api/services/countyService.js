class CountyService {
  constructor(countyModel) {
    this.countyModel = countyModel
  }

  async fetch() {
    return this.countyModel
      .query()
      .select(
        'id', 'name'
      )
  }
}

exports.CountyService = CountyService
