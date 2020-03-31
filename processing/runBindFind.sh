#!/bin/bash

docker run -e run_command='find_bing' -v BingDataVolume:/app/bing_data --env-file=.env-processing 392489498504.dkr.ecr.eu-west-1.amazonaws.com/ppr_processing