# Deploying

## Deploying

  npm run build
  aws s3 cp --recursive --acl bucket-owner-full-control build/ s3://pprsite