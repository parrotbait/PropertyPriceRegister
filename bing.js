const request = require('request')
const utils = require('./utils')
const email = require('./email')
const network = require('./network')
const builder = require('xmlbuilder')
const rimraf = require('rimraf')
const path = require('path')
const xmlConverter = require('xml-js')
const fs = require('fs')
const constants = require('./constants')
const exec_process = require('./exec_process')

let bingDataDirectory = 'bing_data'
let bingApiKey = ''
const quotaError = 'hit_quota'

const NO_ERROR = 0
const UNKNOWN_ERROR = 1
const QUOTA_ERROR = 2

async function startGeocodeJob(xml_file, config) {
  const url =
    'https://spatial.virtualearth.net/REST/v1/dataflows/geocode?input=xml&key=' +
    bingApiKey
    console.log('Bing url (Geocode Job Create) ' + url)
    return new Promise((resolve, reject) => { 
        request.post({url:url, 
            body:utils.loadXmlFromDisk(xml_file),
            headers: {'Content-Type': 'text/xml'}}, (error, response, body) => { // eslint-disable-line no-unused-vars
            if (error) return reject(error)
            if (response === undefined) {
                return reject('null')
            } 
            if (response.statusCode != 200 && response.statusCode != 201) {
                if (response.statusCode == 503) {
                    console.log('Invalid status code <' + response.statusCode + '>' + ' body ' + JSON.stringify(response.body))
                    return reject(quotaError)
                } else {
                    return reject('Invalid status code <' + response.statusCode + '>' + ' body ' + JSON.stringify(response.body))
                }                
            }

            let json = JSON.parse(body)
            let resource = getResourceData(json, reject)
            if (resource == null) return
            let links = getResourceLinkData(resource, reject)
            let linkData = links[0]
            if (!validateProperty(linkData, 'url', reject)) return
            let url = linkData['url'] + '?key=' + bingApiKey
            resolve(url)
        })
    })
}

function validateProperty(json, prop, reject) {
    if (!json.hasOwnProperty(prop)) {
        reject('Missing required property \'' + prop + '\'')
        return false
    }
    return true
}

function getResourceData(json, reject) {
    if (!validateProperty(json, 'resourceSets', reject)) return
    let resourceSets = json['resourceSets']
    if (resourceSets.length == 0) {
        reject('Expected at least 1 resourceSet')
        return null
    }
    let firstRS = resourceSets[0]
    if (!validateProperty(firstRS, 'estimatedTotal', reject)) return
    if (firstRS['estimatedTotal'] == 0) {
        reject('Expected at least 1 resource created')
        return null
    }
    if (!validateProperty(firstRS, 'resources', reject)) return
    let resourcesList = firstRS['resources']
    if (resourcesList.length == 0) {
        reject('Expected at least 1 resource to process')
        return null
    }

    return resourcesList[0]
}

function getResourceLinkData(resource, reject) {
    if (!validateProperty(resource, 'links', reject)) return
    let links = resource['links']
    if (links.length == 0) {
        reject('Expected at least 1 link')
        return null
    }
    return links
}

function parseGeocodeJobStatusResult(response, config) {
    return new Promise((resolve, reject) => { 
        let json = JSON.parse(response)
        let resource = getResourceData(json, reject)
        if (resource == null) return reject('Expect valid resource')
        if (!validateProperty(resource, 'status')) return reject('Expect "status" field in resource')
        if (resource['status'].toLowerCase() === 'pending') return reject(601) // Like a custom http code :)
        let links = getResourceLinkData(resource, reject)
        if (links == null) return reject('Expected links to be present')
        if (links.length < 2) return reject('Expected at least 2 links, self and output')

        if (!validateProperty(resource, 'failedEntityCount')) return reject('Expected failed entity count')
        if (!validateProperty(resource, 'processedEntityCount')) return reject('Expected processed entity count')
        let failedEntityCount = resource.failedEntityCount
        let processedCount = resource.processedEntityCount

        let finalLinks = ['', '']
        for (let i = 0; i < links.length; ++i) {
            let linkData = links[i]
            if (!validateProperty(linkData, 'role')) return
            if (!validateProperty(linkData, 'url')) return
            let url = linkData['url']
            if (linkData['role'] === 'output') {
                if (!validateProperty(linkData, 'name')) return
                let name = linkData['name']
                if (name === 'succeeded') {
                    if (processedCount) {
                        finalLinks[0] = url + '?key=' + bingApiKey
                    }
                } else if (name === 'failed') {
                    if (failedEntityCount) {
                        finalLinks[1] = url + '?key=' + bingApiKey
                    }
                }
            }
        }

        return resolve(finalLinks)
    })
}

function parseGeocodeSuccessResultData(response, onAddressDeterminedCallback) {
    return new Promise((resolve, reject) => { 
        let options = {ignoreComment: true, alwaysChildren: true}
        let root = xmlConverter.xml2js(response, options)
        
        if (typeof(root) !== 'object' || !root.elements) {
            return reject('Missing or invalid root object element')
        }
        let feed = root.elements
        if (!Array.isArray(feed) || feed.length == 0) {
            return reject('Missing or invalid size feed array')
        }
        let feedRoot = feed[0]
        if (!feedRoot.hasOwnProperty('elements')) {
            return reject('Missing \'elements\' key')
        }
        let entities = feed[0].elements
        if (!Array.isArray(entities) || entities.length == 0) {
            return reject('Missing or invalid size entities array')
        }
        
        for (let i = 0; i < entities.length; i++) {
            console.log(`Processing bing entity ${i}/${entities.length}`)
            let entity = entities[i]
            let address = utils.decodeBase64(entity.attributes.Id)
            let elements = entity.elements
            if (elements.length == 0) {
                onAddressDeterminedCallback(address, null, null)
                continue
            }
            for (let j = 0; j < elements.length; ++j) {
                let elem = elements[j]
                if (elem.name === 'GeocodeResponse') {
                    if (elem.elements.length != 5) {
                        console.log('Expected 5 elements returned!')
                        process.exit()
                    }
                    
                    let attributes = elem.attributes
                    if (attributes.EntityType && 
                        attributes.EntityType.toLowerCase() !== 'address') {
                        onAddressDeterminedCallback(address, null, null)
                        continue
                    }
                    console.log('Confidence ' + elem.attributes.Confidence)
                    // <Address AddressLine="14 Beaufield Grove" AdminDistrict="County Kildare" CountryRegion="Ireland" 
                    // FormattedAddress="14 Beaufield Grove, Naas, County Kildare, W23 Y7K8, Ireland" 
                    // Locality="Naas" PostalCode="W23 Y7K8" />
                    let addressComponents = elem.elements[0]
                    // elements 1,2,3 don't 'appear' to be relevant
                    //let geocodePoint = elem.elements[1]
                    //let geocodePoint = elem.elements[2]
                    //let address = elem.elements[3]
                    // <Point Latitude="53.37383" Longitude="-6.5989" />
                    let point = elem.elements[4]
                    let lat = point.attributes.Latitude
                    let lon = point.attributes.Longitude

                    let addressResult = {}
                    addressResult.address_components = addressComponents.attributes
                    addressResult.address = addressComponents.attributes.FormattedAddress
                    addressResult.lat = lat
                    addressResult.lon = lon
                    addressResult.place_id = entity.attributes.Id
                    addressResult.postcode = addressComponents.attributes.PostalCode

                    onAddressDeterminedCallback(address, addressResult, null)
                    continue
                }
            }
            console.log(`onAddressDeterminedCallback ${address}`)
            onAddressDeterminedCallback(address, null, null)
        }
        return resolve(true)
    })
}

function parseGeocodeFailedResultData(response, onAddressDeterminedCallback) {
    return new Promise((resolve, reject) => { 
        let options = {ignoreComment: true, alwaysChildren: true}
        let root = xmlConverter.xml2js(response, options)
        if (typeof(root) === 'object' && root.elements) {
            let feed = root.elements
            if (Array.isArray(feed) && feed.length > 0) {
                for (let outer = 0;  outer < feed.length; ++outer) {
                    let feedRoot = feed[outer]
                    if (!feedRoot.hasOwnProperty('name') || feedRoot.name !== 'GeocodeEntity') {
                        console.log('Missing name property')
                        continue
                    }
                    if (feedRoot.hasOwnProperty('elements')) {
                        let entities = feed[0].elements
                        if (Array.isArray(entities) && entities.length) {
                            for (let i = 0; i < entities.length; i++) {
                                let entity = entities[i]
                                let address = utils.decodeBase64(entity.attributes.Id)
                                onAddressDeterminedCallback(address, null, {})
                            }
                        } else {
                            console.log('Missing or invalid size entities array')
                            return reject('Missing or invalid size entities array')
                        }
                    } else {
                        console.log('Missing elements key')
                        return reject('Missing \'elements\' key')
                    } 
                }               
            } else {
                console.log('Missing or invalid size feed array')
                return reject('Missing or invalid size feed array')
            }
        } else {
            console.log('Missing or invalid root object element')
            return reject('Missing or invalid root object element')
        }
        return resolve(true)
    })
}

function fetchGeocodeJobStatus(url) {
    return network.get(url, false, null).catch((err) => {
        console.log(err)
        return false
    })
}

async function processGeocodeJobRequest(url, retryCount, config, onAddressDeterminedCallback) {
    // Step 2: Check geocode job status
    // This can fail if bing hasn't yet processed the batch
    console.log('Fetch Job Status: ' + url)
    const jobStatusResult = await fetchGeocodeJobStatus(url)
    if (!jobStatusResult) {
        return UNKNOWN_ERROR
    }

    let retry = false
    // Index 0 is success, index 1 if failure
    let resultUrls = await parseGeocodeJobStatusResult(jobStatusResult, config).catch((err) => {
        if (err == 601) {
            console.log('Failed to fetch bing data, retry required')
            retry = true
        } else {
            console.log(err)
            return UNKNOWN_ERROR
        }
    })

    // If we failed we need to retry again 'later'
    if (retry) {
        console.log('Retrying bing fetch')
        retryCount++
        if (retryCount > 5) {
            console.log('Exceeded retry count! Bailing out')
            process.exit()
        }

        await utils.timeoutPromise(20000).catch((err) => {
            console.log(err)
            return UNKNOWN_ERROR
        })
        return await processGeocodeJobRequest(url, retryCount, config, onAddressDeterminedCallback)
    }

    console.log('Fetch Job Output urls: ' + JSON.stringify(resultUrls, null, 4))

    // Step 3: Fetch the final 'successful' url (if there is any result)
    if (resultUrls.length > 0 && resultUrls[0].length) {
        let error = NO_ERROR
        let geocodedResultsSuccess = await network.get(resultUrls[0], false, null).catch((err) => {
            console.log(err)
            error = UNKNOWN_ERROR
        })
        if (!geocodedResultsSuccess) error = UNKNOWN_ERROR
        if (error != NO_ERROR) return error

        let wasSuccessful = await parseGeocodeSuccessResultData(geocodedResultsSuccess, onAddressDeterminedCallback).catch((err) => {
            console.log(err)
            error = UNKNOWN_ERROR
        })

        if (!wasSuccessful) return error = UNKNOWN_ERROR
        if (error != NO_ERROR) return error
    }

    if (resultUrls.length > 1 && resultUrls[1].length) {   
        // Step 4 fetch the errors
        let error = NO_ERROR
        
        let geocodedResultsFailure = await network.get(resultUrls[1], false, null).catch((err) => {
            console.log(err)
            error = UNKNOWN_ERROR
        })

        if (!geocodedResultsFailure) return error = UNKNOWN_ERROR
        if (error != NO_ERROR) return error

        let failedProcessed = await parseGeocodeFailedResultData(geocodedResultsFailure, onAddressDeterminedCallback).catch((err) => {
            console.log(err)
            error = UNKNOWN_ERROR
        })

        if (!failedProcessed) return error = UNKNOWN_ERROR
        if (error != NO_ERROR) return error
    }
 
    return NO_ERROR
}

async function batchGeocodeProcessXml(xml_file, config, onAddressDeterminedCallback) {
    // Step 1: Kick off the job with bing
    // We receive back a url that contains the resources requested
    let error = NO_ERROR
    let url = await startGeocodeJob(xml_file, config).catch((err) => {
        if (err === quotaError) {
            console.log('Error - hit user quota limits for key: ' + bingApiKey)
            error = QUOTA_ERROR
        } else {
            console.log(err)
            error = UNKNOWN_ERROR
        }
    })
    if (error != NO_ERROR) return error

    // Wait before trying to fetch the actual bing data (it is asynchronous)
    await utils.timeoutPromise(20000)
    return await processGeocodeJobRequest(url, 0, config, onAddressDeterminedCallback)
}

module.exports = {
    processData: async function(config, onAddressDeterminedCallback) {
        bingDataDirectory = utils.getConfigKey('bing_data_directory', config)
        const bingApiKeys = utils.getConfigKey('bing_api', config)
        if (bingApiKeys.length == 0) {
            console.log('Missing bing api keys')
            process.exit()
        }
        let bingApiIndex = 0
        bingApiKey = bingApiKeys[bingApiIndex]
        // TODO: Store promises and perform x at once to speed up this
        const xml_path = path.join(__dirname, bingDataDirectory)
        if (!fs.existsSync(xml_path)) {
            console.log('Missing bing xml files, these are required before finding via bing. Bailing out')
            process.exit()
        }
        const files = fs.readdirSync(xml_path)
        for (let i = 0; i < files.length; ++i) {
            const file = files[i]
            // We only care about xml files for bing
            if (utils.getFileExtension(file) !== 'xml') continue
            const filePath = path.join(xml_path, file)
            console.log('Processing Bing xml file: ' + file)
            let res = QUOTA_ERROR
            while (res == QUOTA_ERROR) {
                res = await batchGeocodeProcessXml(filePath, config, onAddressDeterminedCallback)

                if (res == QUOTA_ERROR) {
                    bingApiIndex++
                    if (bingApiIndex < bingApiKeys.length) {
                        bingApiKey = bingApiKeys[bingApiIndex]
                    } else {
                        console.log('All bing API keys used')
                        await email.sendEmail(config, i, 'All keys used')
                        break
                    }
                }
            }
            
            if (res != NO_ERROR) {
                console.log(`Failed to get bing data for key ${bingApiKey}`)
                await email.sendEmail(config, i, `Some error for key ${bingApiKey}`)
                process.exit()
            } 
            // Remove the xml file
            rimraf.sync(filePath)
        }
    },
    outputXmlRequestsFiles: function(properties, counties, config) {
        bingDataDirectory = utils.getConfigKey('bing_data_directory', config)
        let xml = builder.create('GeocodeFeed').att('xmlns', 'http://schemas.microsoft.com/search/local/2010/5/geocode').att('Version', '2.0')  
        let num_iterations = 0
        let count = 0
        const records_per_file = 50

        const bingPath = path.join(__dirname, bingDataDirectory)
        if (fs.existsSync(bingPath)) {
            rimraf.sync(bingPath)
        }
        fs.mkdirSync(bingPath)
        for (let i = 0; i < properties.length; ++i) {
            const property = properties[i]
            // Ignore properties that already have decoded places
            if (property.place_id) continue

            let county = Object.keys(counties).reduce((p, c) => { 
                if (counties[c] === property.county) p = {id: counties[c], name: c}
                return p;
              }, {})

            if (!county) continue
            const stringHash = utils.encodeBase64(property.original_address)
            let node = xml.ele('GeocodeEntity', {Id: stringHash, xmlns: 'http://schemas.microsoft.com/search/local/2010/5/geocode'})
            node.ele('GeocodeRequest', {
                Culture: 'en-IE', 
                IncludeNeighborhood: '0', 
                IncludeEntityTypes: '0', 
                MaxResults: '1', 
                Query: property.original_address + ',' + county.name + ',Ireland'
            })
            count++
            if (count >= records_per_file) {
                let filename = ('' + num_iterations).padStart(5, '0') + '.xml'
                console.log('Outputting ' + records_per_file + ' to ' + filename + ' ...')
                ++num_iterations
                let xmlText = xml.end({ pretty: true })
                const xmlPath = path.join(bingPath, filename)
                fs.writeFileSync(xmlPath, xmlText)
                count = 0    
                xml = builder.create('GeocodeFeed').att('xmlns', 'http://schemas.microsoft.com/search/local/2010/5/geocode').att('Version', '2.0')    
            }
        }
    }
}