# House Price Generator

## Prerequisites

NodeJS (my machine is running 8.14.0 so try to have that)

## Description

This project takes a local CSV file that represents the property price index records from the https://propertypriceregister.ie website.

This CSV is terrible. See my fun [rant](https://medium.com/@parrotbait/the-property-price-register-a-rant-f55ca421e798) on it.
The JS attempts to go through the records, salvage what it can and clean up the data a little.

It then should attempt to match up records to latitutde and longitudes via a reverse geocode.
Places that are successfully reverse geocoded can then be used, we reject locations that cannot be found.

### Usage

First install any dependencies via `npm install`

Modify php.ini to alllow large uploads to phpmyadmin (only needed if uploading the sql dump)

        upload_max_filesize=64M
        post_max_size=64M

TODO: Fetch the PPR data

There are two parts to the property price checks.

1. Parse. This step takes the CSV from the property price register, parses it, eliminates junk addresses (as well as we can) and then outputs the addresses in a json format
2. Find. This step takes the output parsed JSON files and uses a third party geocoding service to perform further validation on the address. 
3. When these phases are complete then we have the addresses ready to be used on a map.

        npm run go find bing <csv_json_path> <output_record_success_json_path> <output_record_failure_json_path>

        npm run go parse <input_csv_path> <output_record_success_json_path> <output_record_failure_json_path>

#### Debugging

These are mostly for my own reference (as I keep forgetting).

You need to add a launch.json config to the directory. Switch to the Debugging tab in VSCode and click the cog to add a new config. By default it will add a config to start via the 'Play' button which we do not want. Instead add an 'Attach' configuration. Pick or note down the port selected.
Via Ctrl+Shift+P enable `Toggle Auto Attach`
Go to the Terminal tab and take the commands above (for parsing for example) and remove the npm part making it the raw 'node' command instead replacing the values in angle brackets:

        node --inspect-brk=<port> index.js parse <input_csv_path> <output_record_success_json_path> <output_record_failure_json_path>

#### TODO

Download the CSV file
Background and batch process new entries with downloaded CSV files
Migrate to a database instead of local XML/JSON files

PHP.ini

Bump up the minimum file size to 200MB
