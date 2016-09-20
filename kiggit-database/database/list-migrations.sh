#!/bin/bash
echo $(dirname $0)
NODE_ENV=$1 node $(dirname $0)/util/listMigrations.js $(dirname $0) $2 $3
