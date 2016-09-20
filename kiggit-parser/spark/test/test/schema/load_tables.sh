#!/bin/bash
cqlsh $1 -f /www/test/test/schema/load_tables.cql
#cqlsh -f /schema/new_schema.cql
#cqlsh -f /schema/test_data.cql

