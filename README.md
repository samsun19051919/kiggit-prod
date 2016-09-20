How to install stall the system on a new instance
=================================================
1. start a new ubuntu 14.04 instance
2. log in via shell (you need to use a pem file. either use kiggit.pem if you have the file or create one when you create the instance)
   Then use ssh -i <pem file> root@<ip of the instance>
3. copy  the content from the install.sh file which is in the same dir as this file and paste it in a new file on the server named install.sh
4. Change permisions on the file 
   chmod 755 install.sh
5  run the install, sid back and relax and answer any questions the script might ask
  ./install.sh
6. After the instalation you can run the file run.sh in the kiggit folder

you should then remeber to change any dns setings on amazon which can be found under the route 53 service

