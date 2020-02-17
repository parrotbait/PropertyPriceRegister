const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const assert = require('assert')
const csv = require('csv-parser')
const fs = require('fs')
const moment = require('moment')
const utils = require('./utils')
const bing = require('./bing')
const constants = require('./constants')
const datasource = require('./datasources/datasource')
const knex = require('./knex/knex.js')

const outputIgnoredProperties = false

process.on('unhandledRejection', err => {
  console.error(err)
  process.exit(1)
})

const context = { knex }

async function fetchCounties() {
  const counties = await knex.transaction(trx => {
    return context
      .knex('counties')
      .transacting(trx)
      .then(trx.commit)
      .catch(trx.commit)
  })

  context.counties = {}
  for (let i = 0; i < counties.length; i += 1) {
    context.counties[counties[i].name.toLowerCase()] = counties[i].id
  }
}

function fixPrice(price) {
  let newPrice = price
  const priceFirstChar = parseInt(price.charAt(0), 10)
  // Strip off bad euro character
  if (Number.isNaN(priceFirstChar)) {
    newPrice = price.substring(1)
  }
  // Remove decimal places, not interested
  const foundDot = newPrice.lastIndexOf('.')
  if (foundDot === newPrice.length - 3) {
    newPrice = newPrice.substring(0, newPrice.length - 3)
  }
  newPrice = newPrice.replace(/,/g, '')
  return parseInt(newPrice, 10)
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace)
}

function replaceAllExact(str, find, replace) {
  return str.replace(new RegExp(`(?<!\\w)${find}(?!\\w)`, 'g'), replace)
}

function fixAddress(address) {
  let newAddress = address.toLowerCase()
  // console.log('address ' + newAddress)
  newAddress = newAddress.replace(new RegExp(' {2}', 'g'), ' ')
  // Fix apt. -> Appartment (consistency)
  newAddress = replaceAllExact(newAddress, 'apt.', 'Appartment')
  // Fix apt -> Appartment (consistency)
  newAddress = replaceAllExact(newAddress, 'apt', 'Appartment')
  // Fix number -> "" (consistency)
  if (newAddress.startsWith('number')) {
    newAddress = newAddress.replace('number ', '')
  }
  // Fix no. -> "" (consistency)
  if (newAddress.startsWith('no. ')) {
    newAddress = newAddress.replace('no. ', '')
  }
  // Fix no -> "" (consistency)
  if (newAddress.startsWith('no ')) {
    newAddress = newAddress.replace('no ', '')
  }
  // Make st. -> st (consistency)
  newAddress = replaceAllExact(newAddress, 'st', 'st.')
  newAddress = replaceAllExact(newAddress, 'st..', 'st.')

  // So.....addresses with fadas come through as �
  // Fix the common ones with problems

  // Places
  newAddress = replaceAllExact(newAddress, 'learg�n', 'leargan')
  newAddress = replaceAllExact(newAddress, 'cnoc�n', 'cnocan')
  newAddress = replaceAllExact(newAddress, 'corr�n', 'corran')
  newAddress = replaceAllExact(newAddress, 'creg�n', 'cregan')
  newAddress = replaceAll(newAddress, 'c�bh', 'cobh')
  newAddress = replaceAll(newAddress, 'b.�.c', 'dublin')
  newAddress = replaceAll(newAddress, 'na m�', 'na mí')
  newAddress = replaceAllExact(newAddress, '�tha', 'atha')
  newAddress = replaceAllExact(newAddress, 'chorca�', 'chorcai')
  newAddress = replaceAllExact(newAddress, 'gr�ine', 'greine')
  newAddress = replaceAllExact(newAddress, 'r�ile�ne', 'reilean')
  newAddress = replaceAllExact(newAddress, 'reile�n', 'reilean')
  newAddress = replaceAllExact(newAddress, 'r�ile�n', 'reilean')
  newAddress = replaceAllExact(newAddress, 'chabh�in', 'chabhain')
  newAddress = replaceAllExact(newAddress, 'b�ara', 'beara')
  newAddress = replaceAllExact(newAddress, 'c�il', 'cuil')
  newAddress = replaceAllExact(newAddress, 'c�in', 'duin')
  newAddress = replaceAllExact(newAddress, 'l�n', 'lin')
  newAddress = replaceAllExact(newAddress, 'tig�n', 'tigin')
  newAddress = replaceAllExact(newAddress, 'sm�l', 'smol')
  newAddress = replaceAllExact(newAddress, 'l�na', 'lana')

  // Generic Irish words
  newAddress = replaceAll(newAddress, 'sl�', 'sli')
  newAddress = replaceAll(newAddress, 'p�irc', 'pairc')
  newAddress = replaceAll(newAddress, 'd�n', 'dun')
  newAddress = replaceAll(newAddress, 'dh�n', 'dhun')
  newAddress = replaceAll(newAddress, 'm�r', 'mor')
  newAddress = replaceAllExact(newAddress, 'gl�s', 'glas')
  newAddress = replaceAllExact(newAddress, '�r', 'or')
  newAddress = replaceAllExact(newAddress, 'l�', 'li')
  newAddress = replaceAllExact(newAddress, 's�', 'si')
  newAddress = replaceAllExact(newAddress, 'u�', 'ui')
  newAddress = replaceAllExact(newAddress, 'o�r', 'oir')
  newAddress = replaceAll(newAddress, 'mh�r', 'mhor')
  newAddress = replaceAll(newAddress, 'c�l', 'cul')
  newAddress = replaceAll(newAddress, '�th', 'ath')
  newAddress = replaceAllExact(newAddress, '�rd', 'ard')
  newAddress = replaceAllExact(newAddress, 'r�', 'ri')
  newAddress = replaceAllExact(newAddress, 'caisle�n', 'caislean')

  newAddress = replaceAllExact(newAddress, 'lu�', 'lui')
  newAddress = replaceAll(newAddress, 'c�irt', 'cuirt')
  newAddress = replaceAll(newAddress, 'b�thar', 'bothar')
  newAddress = replaceAll(newAddress, 'bu�', 'bui')
  newAddress = replaceAll(newAddress, 'b�n', 'ban')
  newAddress = replaceAll(newAddress, 'oile�n', 'oilean')

  if (newAddress.indexOf('�') !== -1) {
    return null
  }
  // Split address into components
  const addressComponents = newAddress.split(',')

  // Check and remove the address component if it is 'co. cork'
  // The rest of the data already contains the county field
  if (addressComponents.length > 0) {
    let countyComponent = addressComponents[addressComponents.length - 1]
    // Many addresses have 'co. cork' in the final address component
    // If we see this omit it from the final address
    // Remove 'co. ' (consistency)
    countyComponent = countyComponent.replace('co.', '')
    // Remove 'county ' (consistency)
    countyComponent = countyComponent.replace('county', '')
    // Remove 'co ' (consistency)
    countyComponent = countyComponent.replace('co ', '')
    countyComponent = countyComponent.trim()
    // console.log('info', countyComponent)
    for (
      let countyIdx = 0;
      countyIdx < constants.counties.length;
      countyIdx += 1
    ) {
      const county = constants.counties[countyIdx]

      if (countyComponent === county) {
        // No number at the start...BUT
        // There is a county in the last component
        // THerefore 1 less component available...if only 2 left then we ignore
        addressComponents.pop()
        break
      }
    }

    // We keep all addresses that have numbers in them
    const firstAddressComponent = addressComponents[0].trim()
    const hasNumberAtStart = utils.containsNumber(firstAddressComponent)
    if (!hasNumberAtStart) {
      // If we now only have 1 address component left then we ignore it...
      // Unless it has a space i it
      if (addressComponents.length === 1) {
        if (outputIgnoredProperties) {
          console.log(
            `Ignoring address with only 1 address components: ${newAddress} with county in final address component`
          )
        }
        return null
      }
    }
  }

  let sentence = ''
  // Reconstruct the sentence in the form of: 1 Main St,Carlow Town,Carlow
  for (let i = 0; i < addressComponents.length; i += 1) {
    const component = addressComponents[i].trim()
    // Returns lettters with first letter capitalized
    const result = component
      .toLowerCase()
      .replace(/\b[a-z](?=[a-z]{2})/g, letter => {
        return letter.toUpperCase()
      })

    sentence += result
    if (i < addressComponents.length - 1) {
      sentence += ','
    }
  }

  return sentence
}

async function syncPropertySales(trx, address, row, property, currentSale) {
  if (currentSale.price < 20000) {
    // Ignore this property - probably some error
    return Promise()
  }

  const currentSaleDate = moment(row.date, 'DD/MM/YYYY', true)
  const sqlDate = currentSaleDate.format('YYYY/MM/DD')
  const lastSaleRS = await trx('sales')
    .select('*')
    .where({ property_id: property.id })
    .orderBy('date', 'desc')

  if (!lastSaleRS) {
    return trx('sales').insert({
      property_id: property.id,
      price: currentSale.price,
      date: sqlDate
    })
  }

  const lastSalesList = lastSaleRS.shift()
  for (let i = 0; i < lastSalesList.length; i += 1) {
    const lastSale = lastSalesList[i]
    const lastSaleDate = moment(lastSale.date, 'DD/MM/YYYY', true)
    const diffDays = moment
      .duration(lastSaleDate.diff(currentSaleDate))
      .asDays()
    if (Math.abs(diffDays) > 3) {
      return trx('sales').insert({
        property_id: property.id,
        price: currentSale.price,
        date: sqlDate
      })
    }

    if (currentSale.price === lastSale.price) {
      console.debug(`*** Dupe found ${address} '***'`)
      return Promise()
    }

    console.debug(
      `*** Dupe found with different price
        ${JSON.stringify(row, null, 2)}
         prev record:
        ${JSON.stringify(lastSale, null, 2)}
        '***'`
    )

    if (lastSale.price < 20000) {
      // Remove the last sale - taking this one instead
      // eslint-disable-next-line no-await-in-loop
      await trx('sales')
        .where('id', lastSale.id)
        .del()
    }
  }
  return trx('sales').insert({
    property_id: property.id,
    price: currentSale.price,
    date: sqlDate
  })
}

async function addToRejected(trx, existingAddress) {
  const addressUpper = existingAddress.toUpperCase()
  const addressUpperSafe = utils.mysql_real_escape_string(existingAddress)
  console.log(`Rejecting property ${addressUpper}`)
  await datasource.insert(
    trx,
    'rejected',
    `upper(original_address) = '${addressUpperSafe}'`,
    'original_address',
    addressUpper
  )
}

async function processCSVRowInternal(trx, row) {
  const originalAddress = row.address
  if (!originalAddress) return false
  const originalAddressUpper = originalAddress.toUpperCase()

  const address = fixAddress(originalAddress)
  if (!address) {
    console.log(
      `Ignoring property at row ${row} with invalid address: '${originalAddress}'`
    )
    await addToRejected(trx, originalAddress)
    return false
  }

  const existingRejected = await trx('rejected')
    .select('*')
    .where('original_address', originalAddress)
  if (existingRejected && existingRejected.shift()) {
    console.log(
      `Address at row ${row} with address: ${originalAddress} already rejected`
    )
    return false
  }

  const currentSale = { price: fixPrice(row.price) }
  const lowerCounty = row.county.toLowerCase()
  assert.ok(Object.prototype.hasOwnProperty.call(context.counties, lowerCounty))
  const countryId = context.counties[lowerCounty]
  const property = await datasource.insert(
    trx,
    'properties',
    null,
    'address',
    address,
    {
      address,
      original_address: originalAddressUpper,
      county: countryId
    }
  )

  await syncPropertySales(trx, address, row, property, currentSale)
  return true
}

async function outputBingFiles(counties) {
  const trx = await knex.transaction()
  try {
    const properties = await trx('properties')
      .select('*')
      .whereNull('place_id')
    bing.outputXmlRequestsFiles(properties, counties)
  } catch (err) {
    console.log(err)
  }
  await trx.commit()
}

async function processCSVFile(inputPath) {
  const file = fs.createReadStream(inputPath)
  await fetchCounties(context)

  const lastSale = await knex.transaction(trx => {
    return context
      .knex('sales')
      .select('date')
      .limit(1)
      .orderBy('date', 'desc')
      .transacting(trx)
      .then(trx.commit)
      .catch(trx.commit)
  })

  let lastProcessedDate = moment(0)
  if (lastSale && lastSale.length > 0) {
    lastProcessedDate = moment(lastSale.shift().date)
  }
  console.log(`last_processed_date - ${lastProcessedDate}`)

  const results = []
  file
    .pipe(
      csv([
        'date',
        'address',
        'postcode',
        'county',
        'price',
        'not_full_market_price',
        'vat_exclusive',
        'property_description',
        'size_description'
      ])
    )
    .on('data', data => results.push(data))
    .on('end', async () => {
      // [
      //   { NAME: 'Daffy Duck', AGE: '24' },
      //   { NAME: 'Bugs Bunny', AGE: '22' }
      // ]
      for (let i = 1; i < results.length; i += 1) {
        const row = results[i]
        if (i % 10000 === 0) {
          console.log(`Processed ${i}/${results.length} records`)
        }
        // const address = { row }
        // console.log(`Processing ${address}`)
        const date = moment(row.date, 'DD/MM/YYYY', true)
        if (date.isBefore(lastProcessedDate, 'day')) {
          // console.log(`Date ${date} already processed, skipping`)
          // eslint-disable-next-line no-continue
          continue
        }

        // console.log(`Processing date ${date.format()} ${entry[0]}`)
        // eslint-disable-next-line no-await-in-loop
        const trx = await knex.transaction()
        try {
          // eslint-disable-next-line no-await-in-loop
          await processCSVRowInternal(trx, row, context).then(() => {})
        } catch (err) {
          console.log(err)
          throw err
        }
        // eslint-disable-next-line no-await-in-loop
        await trx.commit()
      }

      await outputBingFiles(context.counties)

      console.log('Finished processing records')
      process.exit(0)
    })
}

async function moveAddressToRejected(trx, existingAddress) {
  // Remove so it's not re-processed
  await trx('properties')
    .where('original_address', existingAddress)
    .del()
  await addToRejected(trx, existingAddress)
}

async function updateAddressForBingResult(trx, existingAddress, bingResult) {
  if (!bingResult || !bingResult.place_id) {
    if (!bingResult) {
      console.log(`No bing result for address: '${existingAddress}'`)
    } else if (!bingResult.place_id) {
      console.log(`No bing place_id for address: '${existingAddress}'`)
    }

    await moveAddressToRejected(trx, existingAddress)
    return
  }
  console.log(
    `Updating property with original address ${existingAddress} to ${bingResult.address}`
  )

  await trx('properties')
    .where('original_address', existingAddress)
    .whereNull('address') // NOTE: this means it will only update once
    .update({
      address: bingResult.address,
      place_id: bingResult.place_id,
      postcode: bingResult.postcode,
      lat: bingResult.lat,
      lon: bingResult.lon,
      updated: moment()
        .utc()
        .format('hh:mm:ss')
    })
}

async function handleAddressDetermined(address, addressResult) {
  const trx = await knex.transaction()
  console.log(`Address determined ${address}`)
  try {
    await updateAddressForBingResult(trx, address, addressResult)
  } catch (err) {
    console.log(err)
    throw err
  }
  await trx.commit()
}

async function processPendingPPRRecords(source) {
  const onAddressDetermined = (address, addressResult) => {
    try {
      handleAddressDetermined(address, addressResult).then(() => {})
    } catch (err) {
      console.log(err)
      throw err
    }
  }
  // Bing is special, it processes xml files already created on disk
  if (source === 'bing') {
    await bing.processData(onAddressDetermined)
  }
}

function logUsage() {
  console.log({
    level: 'error',
    message: 'Usage: node <mode> <input_path> <output_path>'
  })
  console.log({ level: 'error', message: '      mode: find, index' })
  console.log({
    level: 'error',
    message:
      '      input_path: when mode is index path == csv, when find == json output from index step'
  })
  console.log({
    level: 'error',
    message:
      '      output_path: when mode is index path == json converted from csv, when find == json output from cleaning the csv data'
  })
}

/*
$ node process-2.js one two=three four
0: node
1: /Users/mjr/work/node/process-2.js
2: one
*/
const args = process.argv
if (args.length <= 2) {
  logUsage()
  process.exit()
}
let valid = false
const mode = args[2]
switch (mode) {
  case 'find': {
    if (args.length >= 4) {
      const source = args[3]

      try {
        processPendingPPRRecords(source).then(() => {})
      } catch (err) {
        console.log(err)
        throw err
      }
      valid = true
    }
    break
  }
  case 'parse': {
    if (args.length >= 4) {
      const inputResourcePath = args[3]

      if (!fs.existsSync(inputResourcePath)) {
        console.log(`Missing file at path: ' ${inputResourcePath}'`)
        process.exit()
      }

      const extension = utils.getFileExtension(inputResourcePath)
      if (extension === 'csv') {
        try {
          processCSVFile(inputResourcePath).then(() => {})
        } catch (err) {
          console.log(err)
          throw err
        }
        valid = true
      }
    }
    break
  }
  default:
    break
}

if (!valid) {
  logUsage()
  process.exit()
}
