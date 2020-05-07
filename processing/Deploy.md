# Deploying

## Building

  Run `build.sh` to build!

## Deploying

  Create .env-processing, contents in LastPass

  scp -i ~/Downloads/certs/PropertyPriceRegister_EC2_Private.pem fetch_processing.sh ec2-user@ec2-34-247-160-30.eu-west-1.compute.amazonaws.com:/home/ec2-user
fetch_processing.sh

  Run ./fetch_processing.sh

  docker volume create --name BingDataVolume

  docker run -e run_command='parse PPR-ALL.csv' -v BingDataVolume:/app/bing_data --env-file=.env-processing 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing

## Cronjob

Create a shell script called `runBingFind.sh`
  
  docker run -e run_command='find_bing' -v BingDataVolume:/app/bing_data --env-file=.env-processing 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing

Move to sudo with `sudo -s`
Run `crontab -e`

  0 */6 * * * /home/ec2-user/runBingFind.sh >> /home/ec2-user/cron.log 2>&1

## Connecting to RDS DB

  ssh -N -L 1234:properties.clrku9ujd9qa.eu-west-1.rds.amazonaws.com:3306 ec2-user@ec2-34-247-160-30.eu-west-1.compute.amazonaws.com  -i ~/Downloads/certs/PropertyPriceRegister_EC2_Private.pem

  Host: 127.0.0.1
  Username: root
  password: usual
  Database: properties
  Port: 1234

