1. Når der er ændret i database projektet som lever i følgende folder
~/kiggit/kiggit-database/database
Skal der ske følgende

1.1: kør shellscript der starter databaseprojektet
"~/kiggit/kiggit-database/runSystem.sh"

1.2: kør xmlfiler igennem parseren med følgende kommando
"mv ~/kiggit/kiggit-parser/xmlfiles/parsed/text* ~/kiggit/kiggit-parser/xmlfiles/notParsed/"

2.Når der er ændringer i parseren i (~/kiggit/kiggit-parser/parser)
Skal følgende script køres
"~/kiggit/kiggit-parser/runSystem.sh -d"

3.Når der er ændringer i kiggit-server (~/kiggit/kiggit-server/server)
skal følgende script køres
"~/kiggit/kiggit-server/runSystem.sh -d"

I vær af bibliotekerne kiggit-server, kiggit-parser og kiggit database ligger en Dokerfile og et
dertil hørende dockerBuilt.sh script. Når Dockerfile ændres skal det dertil hørende dockerBuild.sh
script afvikles så containeren bliver bygget. Derefter skal der ske det samme som ovenfor så også den
dertil hørende container bliver genstartet.

Så hvis der ændres i ~/kiggit/kiggit-database/Dokerfile skal der ske følgende:
4.1: Scriptet "~/kiggit/kiggit-database/dockerBuilt.sh" afvikles
4.2: punkt 1.1 og 1.2 afvikles.

Hvis ~/kiggit/kiggit-parser/Dokerfile ændres
5.1: ~/kiggit/kiggit-parser/dockerBuild.sh
5.2: punkt 2 afvikles "~/kiggit/kiggit-parser/runSystem.sh -d"

Hvis ~/kiggit/kiggit-server/Dockerfile ændres
6.1: ~/kiggit/kiggit-server/dockerBuild.sh
6.2: punkt 3 afvikles ("~/kiggit/kiggit-server/runSystem.sh -d")

