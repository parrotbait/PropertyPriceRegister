# Deploying

## Building

  docker build -t ppr_processing .
  docker tag ppr_processing:latest 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing:latest

  docker push 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing:latest

## Deploying

  aws ecr get-login-password --region eu-west-1
   eyJwYXlsb2FkIjoiSVJ4MllWa2FROGdxRTRBQ29paGxxYmViaTl3WjhUSzBjYjJNSU9lcEsvQXY3N09abXZJOUtSM2lLRkRTalZkc0czT05RNjNNd2V1RFFycjloMVMrVTc5MG1pR0tPb2pLcC9uN1ZTcDFrWVREY3Rmek1CaFc0MDhSbW83SXFab29BcHFZQ0g3bGordFdmZXF2UzZQd1o4NytDSVAyRGcvcVUxdy9FWUVoVFEzOUdQOHpaZzdNTlh4a0U5bFRDQzdhdlNMVjI3T3VPWEVadFhidVMxZG5vbHRCZnQwaTc3UDk5TEllayt1VDRyOVUvQ2NnRWVJU1lsQ3BWbGFjZWxYRllIS2pKaWcrTktFS3FKUGl2WDhkQ1UzUit2clM0RlRzNll2NmxOYTNMNDFYM3lqS0sxSjhxdVR1UFFRTmlCTGtvb3Q1N1V6dG5SbHJnTmJsRGhGWVZCanFjejlaMU03alM0V0Z5Q09FZWNkWWM2bHpQY25tUk8ybHJCOXBHZGVrOWRBYm9rMFZkYW5NblJUV0VrcU5pL2dGNldCK1UvVndsTnF5ZGtNZjFTT1k5eStIMk9sN3E2dm5CcWdjbk5pOWpMWkpjZ3R0dktGUU9wRUoySWRCSVdCN1ZZblZ0QXA0dlVJNlF4bDByYlRNUFA5NW5ObEVoREZRemRHa2NIVndYR3haUzRsUlIyaTI5Q3h1elpxVnE1aExUdjhLYzlSOE1aRURZNld0NkE3dDRDQjlrNTYrWFEyUVpSK0RrK210dWFaQzVXWUtKZUM5T290VjBpNGRiRDBXVVNMWHpUYm9uZHI1Mm1JMWtrQTQ1K2Q3OUcrUFg4V3c2WmxWRzBHdUhZUzBUVUJCY2MxQ1plU3RhcXZUUEU3R3dqK3Z5bTBwRUp2Smd5akg4clhNSkFFRWVQb2VrMG5XYmIxTWxQV2VzMGx0WENyNGluUkQ2UVBzdWY1T1c4T3BhQVVObkRnSVZ3bGx1U3ZWcmRGR3ZaUm5IZG5xcUIxTzQ2SVZRZ24xcEZQbEJ5QlkySVFPMmg1R0pkcDJLNTZDVmFlbWhYMnJnYlJjeEZGdkx4ak5BQ05RczVkOXRZaUhkbTFNYWZUUWRsaEJpYkplTGxqejM3R0hBWDdISkhTSEZ0NWx3Y2dsRnJaSlhVb1RYa0ZuNExYNWt1MGJZclBNakdidlZqYTBxakpDdVJ0V1pvTlFEV3hiOEU3VElRRExEZ01XbXQ0ajJrVUF3aU5EQXlxc1B0Q1dOb0JZTDdmYmF1YkxaL0dRek9qVm1pOVJrdWxZTmljVTRyVzB5d3ZueVdYQ3JtTWRqeHZrd0p1K1c2cjdKRXJJMUhjL1NpOHNaUVdsRWVySHl3bkdSRHRkY2ZwQ01SM21PeGhMWGZKaSIsImRhdGFrZXkiOiJBUUVCQUhoK2RTK0JsTnUwTnhuWHdvd2JJTHMxMTV5amQrTE5BWmhCTFpzdW5PeGszQUFBQUg0d2ZBWUpLb1pJaHZjTkFRY0dvRzh3YlFJQkFEQm9CZ2txaGtpRzl3MEJCd0V3SGdZSllJWklBV1VEQkFFdU1CRUVERENFMUNxRHlReTlkcDdib3dJQkVJQTdCRTM4Q055VVlhaTR6QjhLN3grYnZPVWtERVY4WDZOaS9Ld1BVaEdrTjl4UStnN3Rzc0NhYjR4aTE3bVcxc3UrMzArbDlNekt0ckxUUVRzPSIsInZlcnNpb24iOiIyIiwidHlwZSI6IkRBVEFfS0VZIiwiZXhwaXJhdGlvbiI6MTU4NTA0MzA4OH0= https://392489498504.dkr.ecr.eu-west-1.amazonaws.com

  Remove `-e none`

  docker pull 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing:latest

  docker volume create --name BingDataVolume

  docker run -e run_command='parse PPR-ALL.csv' -v BingDataVolume:/app/bing_data --env-file=.env-processing 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing

## Cronjob

Create a shell script called `runBingFind.sh`
  
  docker run -e run_command='find_bing' -v BingDataVolume:/app/bing_data --env-file=.env-processing 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing

Run `crontab -e`

  0 */6 * * * /home/ec2-user/runBingFind.sh >> /var/log/cron.log 2>&1

## Connecting to RDS DB

  ssh -N -L 1234:properties.clrku9ujd9qa.eu-west-1.rds.amazonaws.com:3306 ec2-user@ec2-34-247-160-30.eu-west-1.compute.amazonaws.com  -i ~/Downloads/certs/PropertyPriceRegister_EC2_Private.pem

  Host: 127.0.0.1
  Username: root
  password: usual
  Database: properties
  Port: 1234

