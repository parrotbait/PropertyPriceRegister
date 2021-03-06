docker build -t ppr_processing .
docker tag ppr_processing:latest 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing:latest
aws ecr get-login-password \
    --region eu-west-1 \
  | docker login \
    --username AWS \
    --password-stdin 392489498504.dkr.ecr.eu-west-1.amazonaws.com
docker push 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing:latest
