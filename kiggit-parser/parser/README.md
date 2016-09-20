The parser listen to the feet from betradar. Betradar sends different types of feeds. The parser listen on the path /bet and save the received data to xml files in th folder xmlfiles/notParsed.  This logic is defined in parser/routes/index.js

xmlfilehandler.js:
==================
Parsing the files is first handled by the function parseFiles in the file xmlFileHandler. ParseFiles check the folder xmlfiles/notParsed and hand the files over to be parsed in parser.js. If the files get parsed correctly the files is moved to xmlFiles/parsed. And parseFiles call it self.

parser.js
=========
The parser function use the lib xml2js to convert the xml feed into a json object. As bet radar is sending different type of data we chechk what type it is before handing it over to the specific parser for that type of feed. The only feed which is used at the moment is BetData. This feed contains validated data for all matches and their results. The other feeds also contains some information such as livescore etc. But they are not approved for betting as they are not validated. So when a betData feed is received it is handed over to the betData parser in /parserlib/parsers/betData.js

betData.js
==========
The betData feed contains all nessesary information about matches, such as scheduled time, which tournament they belong to, results when the match has been played, etc. One file can contain information about multiple matches. Therefore there are a lot of nested loops. The information is the put forward to 3 different data handlers/models. 

upcommin_matches in parser/model/upcomming_matches.js
matchModel in parser/model/match
resultHandler in parser/lib/resultHandler.js

upcomming matches and matchModel just save the information to the database. The resulthandler is a litle more complicated and is described below

resultHandler.js
================
Obvious the resultHandler is only called if their is a result. 
The handle function first check if their is already a result in the database (line 88). If their is already a result we chechk if the result is the same as the received one (line 89-91). If it is different then it is checked if the betslip already was Resolved (resolved = money got payd out)  This is done whit the helper function chechBetslipResolved(line 92). If it was ressolved a warning is issued as we then manually have to see what went wrong. All this is pure error handling and to make sure we handle the situation that a result get changed by Betradar. They garantie this should not happen but we better make sure.
If their is not already a result in the database the result is insertet and all betslips  which this match is part of is checked to see if this result finalize the betslip. This is done with the helper function checkBetslips (line 123). If the betslip is finalized with the recived result the spark program is started. The sparke program resolve the betslip. The source for the program is defined in the file /spark/spark-payout/simpleCApp/src/main/scala/SimpleApp.scala






