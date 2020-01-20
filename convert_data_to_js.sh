#!/bin/bash
cp $1 $2
sed -i.old '1s;^;const properties = ;' $2