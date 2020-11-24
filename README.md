# House Price Generator

## Description

This project takes a local Property Price Register CSV file from the https://propertypriceregister.ie website, parses, performs reverse geocoding and inserts/updates records into a remote database (I use RDS).

This CSV is terrible. See my fun [rant](https://medium.com/@parrotbait/the-property-price-register-a-rant-f55ca421e798) on it.
The JS attempts to go through the records, salvage what it can and clean up the data a little.

It then should attempt to match up records to latitutde and longitudes via a reverse geocode.
Places that are successfully reverse geocoded can then be used, we reject locations that cannot be found.

The repo has three separate components:

1. `processing:` A NodeJS module that parses property price register CSVs updates a database and performs searches using bing to find reverse geocode matches.
2. `api`: A NodeJS Express module that reads the database and provides access to the properties, counties and sales.
3. `site`: A React Bootstrap frontend that uses `api` to display the property details. The site can be deployed statically via AWS S3.

Unfortunately I haven't really spent too much time documenting everything, it was just my own thing for ages and didn't think I'd make it public.

### Pre-requisites

Homebrew
Node (my machine is running 8.14.0 so try to have that)
NPM
Mysql
JDK (for mysql)

## Usage

### Processing

First install any dependencies via `npm install`. Then set up your `.env` (use `.env.example` as reference).

There are two parts to the property price checks.

1. Parse. This step takes the CSV from the property price register, parses it, eliminates junk addresses (as well as we can) and then outputs the addresses in a json format

        node index.js parse PPR-ALL.csv

2. Find. This step takes the output parsed JSON files and uses a third party geocoding service to perform further validation on the address.
3. When these phases are complete then we have the addresses ready to be used on a map. The Bing find process is generally run as a cron job, it emails when completed and automatically cycles through all the Bing API keys present in the `.env` repo.

        node index.js find bing

### API

First install dependencies (`npm install`), set up the `.env` (use `.env.example` as reference) and then run:

        npm start

### Site

First install dependencies (`npm install`), set up the `.env` (use `.env.example` as reference) and then run:

        npm start

## Database

I've included the database scheme in `db_schema`, you can use that for your own database.

## Deploying

I have some rudimentary docker support, it generally works. There's a `DockerFile` in `api` and `processing`, each of which is it's own container.
I build images and pushed to ECR, manually pulling down on a EC2 instance and reloaded the images. I didn't bother automatic it further than that. Using `build.sh` will build and upload to ECR, though the urls are hardcoded so it won't be of much use to others unless they change it.

### Known Issues

* The `processing` container sometimes get stuck and doesn't terminate successfully when running as a cron job. This has caused resource exhaustion on a micro EC2 instance, could be investigated in future.