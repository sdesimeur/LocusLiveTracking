# To protect this admin section
# Rename this file .htaccess
# Create the file /absolute/path/to/.htpasswd with the next command  "htpasswd /absolute/path/to/.htpasswd locus"
# Edit this file with the true path

AuthType Basic
AuthName "Saisissez vos identifants"
AuthUserFile /absolute/path/to/.htpasswd
Require user locus
