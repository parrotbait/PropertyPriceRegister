#!/bin/bash

SERVER=392489498504.dkr.ecr.eu-west-1.amazonaws.com
REPO=ppr_api

echo $(aws ecr get-authorization-token --region eu-west-1 --output text --query 'authorizationData[].authorizationToken' | base64 -d | cut -d: -f2) | docker login -u AWS https://$SERVER --password-stdin
echo "docker pull $SERVER/$REPO:latest"
docker pull $SERVER/$REPO:latest