import http from 'http';
import https from 'https';
//import * as FS from 'fs';
//import * as PATH from 'path';
//import { readFile, writeFile } from 'fs/promises';
//import { promises as fs } from 'fs';
import fs from 'fs'
import fetch from 'node-fetch';
import {inspect} from "util";
import { uuids } from "./database/uuids";

const hostname = '0.0.0.0';
const port_http = 3000;
const port_https = 3443;


function serve (req: http.IncomingMessage, res: http.ServerResponse)
{
  console.log(inspect(req.url));
  switch (req.url)
  {
    case "/admin/upload":
      console.log(inspect(req.url));
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      console.log("Current directory:", __dirname);
      res.write(inspect(uuids["clement"]) + "\n");
      res.end('Hello, world!\n');
      break;
    default:
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Wrong query!\n');
      break;
  }
}

var options: https.ServerOptions = {
	key: fs.readFileSync('/etc/ssl/private/key.pem'),
	cert: fs.readFileSync('/etc/ssl/private/cert.pem')
}

const server_http: http.Server = http.createServer(serve);
server_http.listen(port_http, () => {
  console.log(`Server running at http://${hostname}:${port_http}/`);
});
const server_https: https.Server = https.createServer(options, serve);
server_https.listen(port_https, () => {
  console.log(`Server running at https://${hostname}:${port_https}/`);
});
