const request = require('request')
const utils = require('./utils')
const email = require('./email')
const network = require('./network')
const builder = require('xmlbuilder')
const rimraf = require('rimraf')
const path = require('path')
const xmlConverter = require('xml-js')
const fs = require('fs')

let bingDataDirectory = 'bing_data'
let bingApiKey = ''
const quotaError = 'hit_quota'

const NO_ERROR = 0
const UNKNOWN_ERROR = 1
const QUOTA_ERROR = 2

function validateProperty(json, prop, reject) {
  if (!Object.prototype.hasOwnProperty.call(json, prop)) {
    reject(new Error(`Missing required property "${prop}"`))
    return false
  }
  return true
}

function getResourceData(json, reject) {
  if (!validateProperty(json, 'resourceSets', reject)) return null
  const { resourceSets = [] } = json
  if (resourceSets.length === 0) {
    reject('Expected at least 1 resourceSet')
    return null
  }
  const firstRS = resourceSets[0]
  if (!firstRS) return null
  const { estimatedTotal = 0 } = firstRS
  if (estimatedTotal === 0) {
    reject('Expected at least 1 resource created')
    return null
  }
  const { resources = [] } = firstRS
  if (resources.length === 0) {
    reject('Expected at least 1 resource to process')
    return null
  }

  return resources[0]
}

function getResourceLinkData(resource, reject) {
  if (!validateProperty(resource, 'links', reject)) return null
  const { links = [] } = resource
  if (links.length === 0) {
    reject('Expected at least 1 link')
    return null
  }
  return links
}

async function startGeocodeJob(xmlFile) {
  const url = `https://spatial.virtualearth.net/REST/v1/dataflows/geocode?input=xml&key=${bingApiKey}`
  console.log(`Bing url (Geocode Job Create) '${url}'`)
  return new Promise((resolve, reject) => {
    request.post(
      {
        url,
        body: utils.loadXmlFromDisk(xmlFile),
        headers: { 'Content-Type': 'text/xml' }
      },
      (error, response, body) => {
        // eslint-disable-line no-unused-vars
        if (error) return reject(error)
        if (response === undefined) {
          return reject(new Error('null'))
        }
        if (response.statusCode !== 200 && response.statusCode !== 201) {
          if (response.statusCode === 503) {
            console.log(
              `Invalid status code <'${
                response.statusCode
              }> body ${JSON.stringify(response.body)}`
            )
            return reject(quotaError)
          }
          return reject(
            new Error(
              `Invalid status code <${
                response.statusCode
              }> body ${JSON.stringify(response.body)}`
            )
          )
        }

        const json = JSON.parse(body)
        const resource = getResourceData(json, reject)
        if (!resource) return reject(new Error('Missing resource'))
        const links = getResourceLinkData(resource, reject)
        const linkData = links[0]
        if (!validateProperty(linkData, 'url', reject)) {
          return reject(new Error('Missing url'))
        }
        const finalUrl = `${linkData.url}?key=${bingApiKey}`
        return resolve(finalUrl)
      }
    )
  })
}

function parseGeocodeJobStatusResult(response) {
  return new Promise((resolve, reject) => {
    const json = JSON.parse(response)
    const resource = getResourceData(json, reject)
    if (!resource) return reject(new Error('Expect valid resource'))
    if (!validateProperty(resource, 'status'))
      return reject(new Error('Expect "status" field in resource'))
    if (resource.status.toLowerCase() === 'pending')
      return reject(new Error(601)) // Like a custom http code :)
    const links = getResourceLinkData(resource, reject)
    if (!links) return reject(new Error('Expected links to be present'))
    if (links.length < 2)
      return reject(new Error('Expected at least 2 links, self and output'))

    if (!validateProperty(resource, 'failedEntityCount'))
      return reject(new Error('Expected failed entity count'))
    if (!validateProperty(resource, 'processedEntityCount'))
      return reject(new Error('Expected processed entity count'))
    const { failedEntityCount } = resource
    const processedCount = resource.processedEntityCount

    const finalLinks = ['', '']
    for (let i = 0; i < links.length; i += 1) {
      const linkData = links[i]
      if (!validateProperty(linkData, 'role')) {
        return reject(new Error('Missing role'))
      }
      if (!validateProperty(linkData, 'url')) {
        return reject(new Error('Missing url'))
      }
      const { url } = linkData
      if (linkData.role === 'output') {
        if (!validateProperty(linkData, 'name')) {
          return reject(new Error('Missing name'))
        }
        const { name } = linkData
        if (name === 'succeeded') {
          if (processedCount) {
            finalLinks[0] = `${url}?key=${bingApiKey}`
          }
        } else if (name === 'failed') {
          if (failedEntityCount) {
            finalLinks[1] = `${url}?key=${bingApiKey}`
          }
        }
      }
    }

    return resolve(finalLinks)
  })
}

async function parseGeocodeSuccessResultData(response, onAddressDeterminedCallback) {
  const options = { ignoreComment: true, alwaysChildren: true }
  const root = xmlConverter.xml2js(response, options)

  if (typeof root !== 'object' || !root.elements) {
    throw new Error('Missing or invalid root object element')
  }
  const feed = root.elements
  if (!Array.isArray(feed) || feed.length === 0) {
    throw new Error('Missing or invalid size feed array')
  }
  const feedRoot = feed[0]
  if (!Object.prototype.hasOwnProperty.call(feedRoot, 'elements')) {
    // eslint-disable-next-line quotes
    throw new Error("Missing 'elements' key")
  }
  const entities = feed[0].elements
  if (!Array.isArray(entities) || entities.length === 0) {
    console.log('Expected 5 elements returned!')
    throw new Error('Missing or invalid size entities array')
  }

  for (let i = 0; i < entities.length; i += 1) {
    console.log(`Processing bing entity ${i}/${entities.length}`)
    const entity = entities[i]
    const address = utils.decodeBase64(entity.attributes.Id)
    const { elements } = entity
    if (elements.length === 0) {
      console.log(`No bing entities found for address ${address}`)
      await onAddressDeterminedCallback(address, null, null)
      // eslint-disable-next-line no-continue
      continue
    }
    for (let j = 0; j < elements.length; j += 1) {
      const elem = elements[j]
      if (elem.name === 'GeocodeResponse') {
        if (elem.elements.length !== 5) {
          console.log('Expected 5 elements returned!')
          process.exit()
        }

        const { attributes } = elem
        if (
          attributes.EntityType &&
          attributes.EntityType.toLowerCase() !== 'address'
        ) {
          console.log(`Invalid entity type '${attributes.EntityType.toLowerCase()}' for address ${address}`)
          await onAddressDeterminedCallback(address, null, null)
          // eslint-disable-next-line no-continue
          continue
        }
        console.log(`Confidence ${elem.attributes.Confidence}`)
        // <Address AddressLine="14 Beaufield Grove" AdminDistrict="County Kildare" CountryRegion="Ireland"
        // FormattedAddress="14 Beaufield Grove, Naas, County Kildare, W23 Y7K8, Ireland"
        // Locality="Naas" PostalCode="W23 Y7K8" />
        const addressComponents = elem.elements[0]
        // elements 1,2,3 don't 'appear' to be relevant
        // let geocodePoint = elem.elements[1]
        // let geocodePoint = elem.elements[2]
        // let address = elem.elements[3]
        // <Point Latitude="53.37383" Longitude="-6.5989" />
        const point = elem.elements[4]
        const lat = point.attributes.Latitude
        const lon = point.attributes.Longitude

        const addressResult = {}
        addressResult.address_components = addressComponents.attributes
        addressResult.address = addressComponents.attributes.FormattedAddress
        addressResult.lat = lat
        addressResult.lon = lon
        addressResult.place_id = entity.attributes.Id
        addressResult.postcode = addressComponents.attributes.PostalCode

        console.log(`Found match with bing place_id ${entity.attributes.Id} for address ${address}`)
        await onAddressDeterminedCallback(address, addressResult, null)
        // eslint-disable-next-line no-continue
        continue
      }
    }
  }
  return true
}

async function parseGeocodeFailedResultData(response, onAddressDeterminedCallback) {
  const options = { ignoreComment: true, alwaysChildren: true }
  const root = xmlConverter.xml2js(response, options)
  if (typeof root === 'object' && root.elements) {
    const feed = root.elements
    //console.log(`Failed geocode with error ${JSON.stringify(root, null, 4)}`)
    if (Array.isArray(feed) && feed.length > 0) {
      for (let outer = 0; outer < feed.length; outer += 1) {
        const feedRoot = feed[outer]
        if (
          !Object.prototype.hasOwnProperty.call(feedRoot, 'name') ||
          feedRoot.name !== 'GeocodeFeed'
        ) {
          console.log('Missing or incorrect name property')
          // eslint-disable-next-line no-continue
          continue
        }
        if (Object.prototype.hasOwnProperty.call(feedRoot, 'elements')) {
          const entities = feed[0].elements
          if (Array.isArray(entities) && entities.length) {
            for (let i = 0; i < entities.length; i += 1) {
              const entity = entities[i]
              const address = utils.decodeBase64(entity.attributes.Id)
              console.log(`Failed to decode ${address}`)
              await onAddressDeterminedCallback(address, null, {})
            }
          } else {
            console.log('Missing or invalid size entities array')
            throw new Error('Missing or invalid size entities array')
          }
        } else {
          console.log('Missing elements key')
          throw new Error('Missing "elements" key')
        }
      }
    } else {
      console.log('Missing or invalid size feed array')
      throw new Error('Missing or invalid size feed array')
    }
  } else {
    console.log('Missing or invalid root object element')
    throw new Error('Missing or invalid root object element')
  }
  return true
}

function fetchGeocodeJobStatus(url) {
  return network.get(url, false, null).catch(err => {
    console.log(err)
    return false
  })
}

async function processGeocodeJobRequest(
  url,
  retryCount,
  onAddressDeterminedCallback
) {
  let retryCnt = retryCount
  // Step 2: Check geocode job status
  // This can fail if bing hasn't yet processed the batch
  console.log(`Fetch Job Status: ${url}`)
  const jobStatusResult = await fetchGeocodeJobStatus(url)
  if (!jobStatusResult) {
    return UNKNOWN_ERROR
  }

  let retry = false
  // Index 0 is success, index 1 if failure
  const resultUrls = await parseGeocodeJobStatusResult(jobStatusResult).catch(
    err => {
      if (err.toString() === "Error: 601") {
        console.log('Failed to fetch bing data, retry required')
        retry = true
      } else {
        console.log(err)
        return UNKNOWN_ERROR
      }
      return true
    }
  )

  // If we failed we need to retry again 'later'
  if (retry) {
    console.log('Retrying bing fetch')
    retryCnt += 1
    if (retryCnt > 5) {
      console.log('Exceeded retry count! Bailing out')
      process.exit()
    }

    await utils.timeoutPromise(20000).catch(err => {
      console.log(err)
      return UNKNOWN_ERROR
    })
    return processGeocodeJobRequest(url, retryCnt, onAddressDeterminedCallback)
  }

  console.log(`Fetch Job Output urls: ${JSON.stringify(resultUrls, null, 4)}`)

  // Step 3: Fetch the final 'successful' url (if there is any result)
  if (resultUrls.length > 0 && resultUrls[0].length) {
    let error = NO_ERROR
    const geocodedResultsSuccess = await network
      .get(resultUrls[0], false, null)
      .catch(err => {
        console.log(err)
        error = UNKNOWN_ERROR
      })
    if (!geocodedResultsSuccess) error = UNKNOWN_ERROR
    if (error !== NO_ERROR) return error

    const wasSuccessful = await parseGeocodeSuccessResultData(
      geocodedResultsSuccess,
      onAddressDeterminedCallback
    ).catch(err => {
      console.log(err)
      error = UNKNOWN_ERROR
    })

    if (!wasSuccessful) return error === UNKNOWN_ERROR
    if (error !== NO_ERROR) return error
  }

  if (resultUrls.length > 1 && resultUrls[1].length) {
    // Step 4 fetch the errors
    let error = NO_ERROR

    const geocodedResultsFailure = await network
      .get(resultUrls[1], false, null)
      .catch(err => {
        console.log(err)
        error = UNKNOWN_ERROR
      })

    if (!geocodedResultsFailure) return error === UNKNOWN_ERROR
    if (error !== NO_ERROR) return error

    const failedProcessed = await parseGeocodeFailedResultData(
      geocodedResultsFailure,
      onAddressDeterminedCallback
    ).catch(err => {
      console.log(err)
      error = UNKNOWN_ERROR
    })

    if (!failedProcessed) return error === UNKNOWN_ERROR
    if (error !== NO_ERROR) return error
  }

  return NO_ERROR
}

async function batchGeocodeProcessXml(xmlFile, onAddressDeterminedCallback) {
  // Step 1: Kick off the job with bing
  // We receive back a url that contains the resources requested
  let error = NO_ERROR
  const url = await startGeocodeJob(xmlFile).catch(err => {
    if (err === quotaError) {
      console.log(`Error - hit user quota limits for key: ${bingApiKey}`)
      error = QUOTA_ERROR
    } else {
      console.log(err)
      error = UNKNOWN_ERROR
    }
  })
  if (error !== NO_ERROR) return error

  // Wait before trying to fetch the actual bing data (it is asynchronous)
  await utils.timeoutPromise(20000)
  return processGeocodeJobRequest(url, 0, onAddressDeterminedCallback)
}

module.exports = {
  async processData(onAddressDeterminedCallback) {
    bingDataDirectory = process.env.BING_DIRECTORY
    const bingApiKeys = process.env.BING_API_KEYS.split(',')
    if (bingApiKeys.length === 0) {
      console.log('Missing bing api keys')
      process.exit()
    }
    let bingApiIndex = 0
    bingApiKey = bingApiKeys[bingApiIndex]
    // TODO: Store promises and perform x at once to speed up this
    const xmlPath = path.join(__dirname, bingDataDirectory)
    if (!fs.existsSync(xmlPath)) {
      console.log(
        'Missing bing xml files, these are required before finding via bing. Bailing out'
      )
      process.exit()
    }
    const files = fs.readdirSync(xmlPath)
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      // We only care about xml files for bing
      // eslint-disable-next-line no-continue
      if (utils.getFileExtension(file) !== 'xml') continue
      const filePath = path.join(xmlPath, file)
      console.log(`Processing Bing xml file: ${file}`)
      let res = QUOTA_ERROR
      while (res === QUOTA_ERROR) {
        // eslint-disable-next-line no-await-in-loop
        res = await batchGeocodeProcessXml(
          filePath,
          onAddressDeterminedCallback
        )

        if (res === QUOTA_ERROR) {
          bingApiIndex += 1
          if (bingApiIndex < bingApiKeys.length) {
            bingApiKey = bingApiKeys[bingApiIndex]
          } else {
            console.log('All bing API keys used')
            // eslint-disable-next-line no-await-in-loop
            await email.sendEmail(i, 'All keys used')
            break
          }
        }
      }

      if (res !== NO_ERROR) {
        console.log(`Failed to get bing data for key ${bingApiKey}`)
        // eslint-disable-next-line no-await-in-loop
        await email.sendEmail(i, `Some error for key ${bingApiKey}`)
        process.exit()
      }
      // Remove the xml file
      rimraf.sync(filePath)
    }
  },
  outputXmlRequestsFiles(properties, counties) {
    bingDataDirectory = process.env.BING_DIRECTORY
    let xml = builder
      .create('GeocodeFeed')
      .att('xmlns', 'http://schemas.microsoft.com/search/local/2010/5/geocode')
      .att('Version', '2.0')
    let numIterations = 0
    let count = 0
    const recordsPerFile = 50

    const bingPath = path.join(__dirname, bingDataDirectory)
    if (fs.existsSync(bingPath)) {
      rimraf.sync(bingPath)
    }
    fs.mkdirSync(bingPath)
    for (let i = 0; i < properties.length; i += 1) {
      const property = properties[i]
      // Ignore properties that already have decoded places
      if (property.place_id) continue

      const county = Object.keys(counties).reduce((p, c) => {
        let result = { ...p }
        if (counties[c] === property.county) {
          result = { id: counties[c], name: c }
        }
        return result
      }, {})

      if (!county || !county.name) continue
      const stringHash = utils.encodeBase64(property.original_address)
      const node = xml.ele('GeocodeEntity', {
        Id: stringHash,
        xmlns: 'http://schemas.microsoft.com/search/local/2010/5/geocode'
      })
      node.ele('GeocodeRequest', {
        Culture: 'en-IE',
        IncludeNeighborhood: '0',
        IncludeEntityTypes: '0',
        MaxResults: '1',
        Query: `${property.original_address},${county.name},Ireland`
      })
      count += 1
      if (count >= recordsPerFile) {
        // eslint-disable-next-line prefer-template
        const filename = ('' + numIterations).padStart(5, '0') + '.xml'
        console.log(`Outputting ${recordsPerFile} to ${filename} ...`)
        numIterations += 1
        const xmlText = xml.end({ pretty: true })
        const xmlPath = path.join(bingPath, filename)
        fs.writeFileSync(xmlPath, xmlText)
        count = 0
        xml = builder
          .create('GeocodeFeed')
          .att(
            'xmlns',
            'http://schemas.microsoft.com/search/local/2010/5/geocode'
          )
          .att('Version', '2.0')
      }
    }
  }
}
