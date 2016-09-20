
#created from http://docs.datastax.com/en/cassandra/3.0/cassandra/install/installDeb.html and
# http://docs.datastax.com/en/cassandra/3.0/cassandra/initialize/initMultipleDS.html
#!/bin/bash
echo "deb http://debian.datastax.com/community stable main" | sudo tee -a /etc/apt/sources.list.d/cassandra.sources.list
curl -L https://debian.datastax.com/debian/repo_key | sudo apt-key add -
sudo apt-get update

# This install the latst 3.0.x version which at this moment is
# the latest maintanaice version
sudo apt-get install dsc30
sudo apt-get install cassandra-tools
sudo service cassandra stop
sudo rm -rf /var/lib/cassandra/data/system/*

SEEDS=$(head -n 1 ~/kiggit/kiggit-database/noDocker/SEEDS)
PUBLICIP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
#Cassandra setup.
sudo sed -i '/.*listen_address: localhost.*/c\listen_address:\ '$(hostname -i)''  /etc/cassandra/cassandra.yaml
sudo sed -i '/.*rpc_address: localhost.*/c\rpc_address:\ '$(hostname -i)''  /etc/cassandra/cassandra.yaml
sudo sed -i '/.*seeds: .*/c\\ \ \ \ \ \ \ \ \ \ -\ seeds:\ '$SEEDS''  /etc/cassandra/cassandra.yaml
sudo sed -i '/.*endpoint_snitch: SimpleSnitch.*/c\endpoint_snitch: GossipingPropertyFileSnitch'  /etc/cassandra/cassandra.yaml
sudo sed -i '/.*# broadcast_address: 1.2.3.4.*/c\broadcast_address: \ '$PUBLICIP''  /etc/cassandra/cassandra.yaml


#first start the seed nodes with sudo service cassandra start then when they are running start the rest of the nodes
