# Deploying

## Building

  Run `build.sh` to build!

## Deploying

  
  Create .env, contents in LastPass
  scp -i ~/Downloads/certs/PropertyPriceRegister_EC2_Private.pem fetch_api.sh ec2-user@ec2-34-247-160-30.eu-west-1.compute.amazonaws.com:/home/ec2-user
fetch_api.sh

  Run ./fetch_api.sh


  aws ecr get-login-password --region eu-west-1
  docker login -u AWS -p eyJwYXlsb2FkIjoiSVJ4MllWa2FROGdxRTRBQ29paGxxYmViaTl3WjhUSzBjYjJNSU9lcEsvQXY3N09abXZJOUtSM2lLRkRTalZkc0czT05RNjNNd2V1RFFycjloMVMrVTc5MG1pR0tPb2pLcC9uN1ZTcDFrWVREY3Rmek1CaFc0MDhSbW83SXFab29BcHFZQ0g3bGordFdmZXF2UzZQd1o4NytDSVAyRGcvcVUxdy9FWUVoVFEzOUdQOHpaZzdNTlh4a0U5bFRDQzdhdlNMVjI3T3VPWEVadFhidVMxZG5vbHRCZnQwaTc3UDk5TEllayt1VDRyOVUvQ2NnRWVJU1lsQ3BWbGFjZWxYRllIS2pKaWcrTktFS3FKUGl2WDhkQ1UzUit2clM0RlRzNll2NmxOYTNMNDFYM3lqS0sxSjhxdVR1UFFRTmlCTGtvb3Q1N1V6dG5SbHJnTmJsRGhGWVZCanFjejlaMU03alM0V0Z5Q09FZWNkWWM2bHpQY25tUk8ybHJCOXBHZGVrOWRBYm9rMFZkYW5NblJUV0VrcU5pL2dGNldCK1UvVndsTnF5ZGtNZjFTT1k5eStIMk9sN3E2dm5CcWdjbk5pOWpMWkpjZ3R0dktGUU9wRUoySWRCSVdCN1ZZblZ0QXA0dlVJNlF4bDByYlRNUFA5NW5ObEVoREZRemRHa2NIVndYR3haUzRsUlIyaTI5Q3h1elpxVnE1aExUdjhLYzlSOE1aRURZNld0NkE3dDRDQjlrNTYrWFEyUVpSK0RrK210dWFaQzVXWUtKZUM5T290VjBpNGRiRDBXVVNMWHpUYm9uZHI1Mm1JMWtrQTQ1K2Q3OUcrUFg4V3c2WmxWRzBHdUhZUzBUVUJCY2MxQ1plU3RhcXZUUEU3R3dqK3Z5bTBwRUp2Smd5akg4clhNSkFFRWVQb2VrMG5XYmIxTWxQV2VzMGx0WENyNGluUkQ2UVBzdWY1T1c4T3BhQVVObkRnSVZ3bGx1U3ZWcmRGR3ZaUm5IZG5xcUIxTzQ2SVZRZ24xcEZQbEJ5QlkySVFPMmg1R0pkcDJLNTZDVmFlbWhYMnJnYlJjeEZGdkx4ak5BQ05RczVkOXRZaUhkbTFNYWZUUWRsaEJpYkplTGxqejM3R0hBWDdISkhTSEZ0NWx3Y2dsRnJaSlhVb1RYa0ZuNExYNWt1MGJZclBNakdidlZqYTBxakpDdVJ0V1pvTlFEV3hiOEU3VElRRExEZ01XbXQ0ajJrVUF3aU5EQXlxc1B0Q1dOb0JZTDdmYmF1YkxaL0dRek9qVm1pOVJrdWxZTmljVTRyVzB5d3ZueVdYQ3JtTWRqeHZrd0p1K1c2cjdKRXJJMUhjL1NpOHNaUVdsRWVySHl3bkdSRHRkY2ZwQ01SM21PeGhMWGZKaSIsImRhdGFrZXkiOiJBUUVCQUhoK2RTK0JsTnUwTnhuWHdvd2JJTHMxMTV5amQrTE5BWmhCTFpzdW5PeGszQUFBQUg0d2ZBWUpLb1pJaHZjTkFRY0dvRzh3YlFJQkFEQm9CZ2txaGtpRzl3MEJCd0V3SGdZSllJWklBV1VEQkFFdU1CRUVERENFMUNxRHlReTlkcDdib3dJQkVJQTdCRTM4Q055VVlhaTR6QjhLN3grYnZPVWtERVY4WDZOaS9Ld1BVaEdrTjl4UStnN3Rzc0NhYjR4aTE3bVcxc3UrMzArbDlNekt0ckxUUVRzPSIsInZlcnNpb24iOiIyIiwidHlwZSI6IkRBVEFfS0VZIiwiZXhwaXJhdGlvbiI6MTU4NTA0MzA4OH0= https://392489498504.dkr.ecr.eu-west-1.amazonaws.com

  Remove `-e none`

  docker pull 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_api:latest

  docker run --publish 80:4000 --name api --env-file .env -d 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_api

  docker ps -a
  docker stop <pid>
  docker remote <pid>
