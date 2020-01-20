#!/bin/bash
git add bing_rejected.json
git add bing_accepted.json

if [ -f bing_data.zip ]; then
    rm bing_data.zip
fi
zip -r bing_data.zip bing_data/
git add bing_data.zip

if [ -f csv_processed.json.zip ]; then
    rm csv_processed.json.zip
fi
zip csv_processed.json.zip csv_processed.json
git add csv_processed.json.zip

#git commit -m "Latest bing data"
