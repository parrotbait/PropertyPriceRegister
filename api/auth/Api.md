# API Calls

    curl --header "Content-Type: application/json" \                                                                         
      --request POST \
      --data '{"access_key":"mytoken","access_secret":"password"}' \
      --verbose \
      127.0.0.1:4000/authorize

    curl --header "Content-Type: application/json" \                                                                         
    --request POST \
    --data '{"first_name":"Eddie","second_name":"Long", "email": "parrotbait@gmail.com"}' \
    --verbose \
    127.0.0.1:4000/register