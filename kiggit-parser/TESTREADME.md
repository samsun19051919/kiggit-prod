Running tests on the parser
===========================

The mocha tests require the database and parser to be running. 
Remember that it is expected that the kiggit root folder is at /home/user/kiggit.

* 1. Start the database (kiggit-database/runSystem.sh -d)

* 2. Run the parser (kiggit-parser/runSystem.sh)  

* 3. In a new window run the test script. (kiggit-parser/runTest.sh)

The reason that the runTest.sh script does not handle starting the database and parser is
that if you want to run the tests multiple times you don't have to wait for the database and parser to
start up.
