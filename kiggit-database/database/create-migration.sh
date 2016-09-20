#!/bin/bash

echo ${1// /_}
echo creating migration : ${1// /_}
filename=migrations/`date +%Y%m%d%H%M%S-${1// /_}.cql`
touch $filename

echo "-- THIS IS A MIGRATION FOR KIGGIT Cassandra DB" >> $filename
