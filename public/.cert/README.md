# Certificate folder

This folder contains the site private key and SSL certificate

Use the following openssl commands to generate them. 

$ openssl genrsa -out key.pem // Generate private key
$ openssl req -new -key key.pem -out csr.pem // Create certificate signin request
$ openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem // Generate SSL certificate (del csr.pem)
