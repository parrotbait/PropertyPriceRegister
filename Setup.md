# Setup

To set up a new EC2 instance you need to do the following:

  sudo yum update
  sudo yum install docker

  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip awscliv2.zip
  sudo ./aws/install
  
  aws configure

  ...

  sudo service docker start
  sudo usermod -a -G docker ec2-user

  aws ecr get-login-password
  sudo docker login -u AWS -p <password> https://392489498504.dkr.ecr.eu-west-1.amazonaws.com  

  Transfer over/create any env file

  Add the new instance to the Default Security Group.

  See Deploy.md for logging in to AWS.