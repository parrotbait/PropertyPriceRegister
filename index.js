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
  
async function fetchCounties(context) {
    const { knex } = context
    let counties = await knex.transaction(trx => {
        return context.knex('counties')
        .transacting(trx)
        .then(trx.commit)
        .catch(trx.commit)
    })

    context.counties = {}
    for (let i = 0; i < counties.length; i+=1) {
        context.counties[counties[i].name.toLowerCase()] = counties[i].id
    }

}

const context = { knex }

function fixPrice(price) {
    let newPrice = price
    const priceFirstChar = parseInt(price.charAt(0))
    // Strip off bad euro character
    if (isNaN(priceFirstChar)) {
        newPrice = price.substring(1)
    }
    // Remove decimal places, not interested
    const foundDot = newPrice.lastIndexOf('.')
    if (foundDot == newPrice.length - 3) {
        newPrice = newPrice.substring(0, newPrice.length - 3)
    }
    newPrice = newPrice.replace(/,/g, '')
    return parseInt(newPrice)
}

function fixPropertyType(type) {
    if (type === 'Second-Hand Dwelling house /Apartment') {
        return constants.HOUSE_TYPE_SECOND_HAND
    } else if (type === 'New Dwelling house /Apartment') {
        return constants.HOUSE_TYPE_NEW
    }
    return constants.HOUSE_TYPE_UNKNOWN
}


function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace)
}

function replaceAllExact(str, find, replace) {
    return str.replace(new RegExp('(?<!\\w)' + find +  '(?!\\w)', 'g'), replace)
}

function fixAddress(address) {
    let newAddress = address.toLowerCase()
    //console.log('address ' + newAddress)
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
    
    if (newAddress.indexOf('�') != -1) {
        return null
    }
    // Split address into components
    let addressComponents = newAddress.split(',')
    
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
        //console.log('info', countyComponent)
        for (let countyIdx = 0; countyIdx < constants.counties.length; ++countyIdx) {
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
        let hasNumberAtStart = utils.containsNumber(firstAddressComponent)
        if (!hasNumberAtStart) {
            // If we now only have 1 address component left then we ignore it...
            // Unless it has a space i it
            if (addressComponents.length == 1) {
                if (outputIgnoredProperties) {
                    console.log('Ignoring address with only 1 address components: ' + newAddress + ' with county in final address component')  
                }
                return null
            }
            /*else if (addressComponents.length == 2) {
                // We keep addresses that contain a space:
                // e.g. the shrubberies, monkstown
                // This may be a problem for places such as: "Main St, Clonmel"
                if (!utils.containsSpace(firstAddressComponent)) {
                    if (outputIgnoredProperties) {
                        console.log('Ignoring address with 2 or less components: ' + newAddress + ' with county in final address component')  
                    }
                    return null
                } else {
                    /*if (mode.indexOf('remove_duplicates') != -1) {
                        const primaryAddressComponents = firstAddressComponent.split(' ')
                        for (var addIdx = 0; addIdx < primaryAddressComponents.length; ++addIdx) {
                            if (primaryAddressComponents[i] === 'st' ||
                            primaryAddressComponents[i] === 'st.' || 
                            primaryAddressComponents[i] === 'street' || 
                            primaryAddressComponents[i] === 'road' || 
                            primaryAddressComponents[i] === 'rd' ||
                            primaryAddressComponents[i] === 'rd.') {
                                return null
                            }
                        }
                    }*/ /*
                }
            }*/
        }
    }

    let sentence = ''
    // Reconstruct the sentence in the form of: 1 Main St,Carlow Town,Carlow
    for (let i = 0; i < addressComponents.length; i += 1) {
        let component = addressComponents[i].trim()
        // Returns lettters with first letter capitalized
        const result = component.toLowerCase().replace(/\b[a-z](?=[a-z]{2})/g, function(letter) {
            return letter.toUpperCase() 
        })
        
        sentence += result
        if (i < addressComponents.length - 1) {
            sentence += ','
        }
    }

    return sentence
}

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
            default:
                return char;
        }
    });
}

async function processCSVRowInternal(trx, row, context) {
    const original_address = row.address
    if (!original_address) return false
    const original_address_upper = original_address.toUpperCase()

    const address = fixAddress(original_address)
    if (!address) {       
        console.log(`Ignoring property at row ${row} with invalid address: \'${original_address}\``)
        await addToRejected(trx, original_address)
        return false
    }
    
    const existing_rejected = await trx('rejected').select('*')
                                .where('original_address', original_address_upper)
    if (existing_rejected && existing_rejected.shift()) {
        console.log(`Address at row ${row} with address: ${original_address_upper} already rejected`)
        return false
    }
    
    const current_sale = { price: fixPrice(row.price) }
    const lower_county = row.county.toLowerCase()
    assert.ok(context.counties.hasOwnProperty(lower_county))
    const countryId = context.counties[lower_county]
    const property = await datasource.insert(trx, 'properties', null, 'address', address, { address: address, original_address: original_address_upper, county: countryId })
    
    await syncPropertySales(trx, address, row, property, current_sale)
}

async function syncPropertySales(trx, address, row, property, current_sale) {

    if (current_sale.price < 20000) {
        // Ignore this property - probably some error
        return
    }  
    
    const current_sale_date = moment(row.date, 'DD/MM/YYYY', true)
    const sql_date = current_sale_date.format('YYYY/MM/DD')
    let last_sales_rs = await trx('sales').select('*').where({ 'property_id': property.id }).orderBy('date', 'desc')

    if (!last_sales_rs) {
        return await trx('sales').insert({ property_id: property.id, price: current_sale.price, date: sql_date })
    }

    const last_sales_list = last_sales_rs.shift()
    for (let i = 0; i < last_sales_list.length; i += 1) {
        let last_sale = last_sales_list[i]
        const last_sale_date = moment(last_sale.date, 'DD/MM/YYYY', true)
        const diff_days = moment.duration(last_sale_date.diff(current_sale_date)).asDays()
        if (Math.abs(diff_days) > 3) {
            return await trx('sales').insert({ property_id: property.id, price: current_sale.price, date: sql_date })
        }

        if (current_sale.price === last_sale.price) {
            console.debug('*** Dupe found ' + address + '***')
            return
        } 
        
        console.debug('*** Dupe found with different price \n' + JSON.stringify(row, null, 2) + ' prev record: \n' + JSON.stringify(last_sale, null, 2) + '***')
        
        if (last_sale.price < 20000) {
            // Remove the last sale - taking this one instead
            await trx('sales').where('id', last_sale.id).del()
        }
    }
    return await trx('sales').insert({ property_id: property.id, price: current_sale.price, date: sql_date })
}

async function outputBingFiles(counties) {
    const trx = await knex.transaction()
    try {
        const properties = await trx('properties').select('*').whereNull('place_id')
        bing.outputXmlRequestsFiles(properties, counties)
    } catch (err) {
        console.log(err)
    }
    await trx.commit()
}

async function processCSVFile(input_path, context) {
    const file = fs.createReadStream(input_path)
    const { knex } = context
    
    await fetchCounties(context)
    
    let cursorPosition = 0
    let last_sale = await knex.transaction(trx => {
        return context.knex('sales').select('date').limit(1).orderBy('date', 'desc')
        .transacting(trx)
        .then(trx.commit)
        .catch(trx.commit)
    })

    let last_processed_date = moment(0)
    if (last_sale && last_sale.length > 0) {
        last_processed_date = moment(last_sale.shift().date)
    }
    console.log(`last_processed_date - ${last_processed_date}`)

    const results = []
    file
    .pipe(csv(['date', 'address', 'postcode', 'county', 'price', 'not_full_market_price', 'vat_exclusive', 'property_description', 'size_description']))
    .on('data', (data) => results.push(data))
    .on('end', async() => {
        // [
        //   { NAME: 'Daffy Duck', AGE: '24' },
        //   { NAME: 'Bugs Bunny', AGE: '22' }
        // ]
        let trx = null
        
        for (let i = 1; i < results.length; i += 1) {
            let row = results[i]
            if (i % 10000 === 0) {
                console.log(`Processed ${i}/${results.length} records`)
            }
            const address = row.address
            //console.log(`Processing ${address}`)
            const date = moment(row.date, 'DD/MM/YYYY', true)
            if (date.isBefore(last_processed_date, 'day')) {
                //console.log(`Date ${date} already processed, skipping`)
                continue
            }

            //console.log(`Processing date ${date.format()} ${entry[0]}`)
            const trx = await knex.transaction()
            try {
                await processCSVRowInternal(trx, row, context).then((result) => {})
            } catch (err) {
                console.log(err)
                throw err
            }
            await trx.commit()
        }

        let counties = context.counties
        await outputBingFiles(counties)

        console.log('Finished processing records')
        process.exit(0)
    })
}

async function addToRejected(trx, existing_address) {
    const address_upper = existing_address.toUpperCase()
    const address_upper_safe = mysql_real_escape_string(existing_address)
    console.log(`Rejecting property ${address_upper}`)
    await datasource.insert(trx, 'rejected', `upper(original_address) = '${address_upper_safe}'`, 'original_address', address_upper)  
}

async function moveAddressToRejected(trx, existing_address) {
    // Remove so it's not re-processed
    await trx('properties').where('original_address', existing_address).del()
    await addToRejected(trx, existing_address)
}

async function updateAddressForBingResult(trx, existing_address, bing_result) {
    if (!bing_result || !bing_result.place_id) { 
        if (!bing_result) {
            console.log("No bing result")
        } else if (!bing_result.place_id) {
            console.log("No bing place_id")
        } 
        
        await moveAddressToRejected(trx, existing_address)
        return 
    }
    console.log(`Updating property with original address ${existing_address} to ${bing_result.address}`) 

    await trx('properties').where('original_address', existing_address)
                            .whereNull('address') // NOTE: this means it will only update once
                            .update({address: bing_result.address,
                                place_id: bing_result.place_id,
                                postcode: bing_result.postcode,
                                lat: bing_result.lat,
                                lon: bing_result.lon,
                                updated: moment().utc().format('hh:mm:ss')
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

async function processPendingPPRRecords(source, mode) {
    let onAddressDetermined = function(address, addressResult) {
        try {
            handleAddressDetermined(address, addressResult).then((result) => {})
        } catch (err) {
            console.log(err)
            throw err
        }
    }
    // Bing is special, it processes xml files already created on disk
    if (source === 'bing') {
        await bing.processData(onAddressDetermined)    
        return
    }
}

function logUsage() {
    console.log({level:'error', message: 'Usage: node <mode> <input_path> <output_path>'})
    console.log({level:'error', message: '      mode: find, index'})
    console.log({level:'error', message: '      input_path: when mode is index path == csv, when find == json output from index step'})
    console.log({level:'error', message: '      output_path: when mode is index path == json converted from csv, when find == json output from cleaning the csv data'})
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
                processPendingPPRRecords(source, mode).then((result) => {})
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
            const input_resource_path = args[3]
            
            if (!fs.existsSync(input_resource_path)) {
                console.log('Missing file at path: ' + input_resource_path)
                process.exit()
            }

            const extension = utils.getFileExtension(input_resource_path)
            if (extension === 'csv') {
                
                try {
                    processCSVFile(input_resource_path, context).then((result) => {})
                } catch (err) {
                    console.log(err)
                    throw err
                }
                valid = true
            } 
        } 
        break
    }
}

if (!valid) {
    logUsage()
    process.exit()
}
