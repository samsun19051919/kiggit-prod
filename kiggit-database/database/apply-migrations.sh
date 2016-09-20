#!/bin/bash

NODE_ENV=$1 node $(dirname $0)/util/applyMigrations.js $(dirname $0)