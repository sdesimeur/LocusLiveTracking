import http from 'http';
import https from 'https';
//import * as FS from 'fs';
//import * as PATH from 'path';
//import { readFile, writeFile } from 'fs/promises';
//import { promises as fs } from 'fs';
import fs from 'fs'
import fetch from 'node-fetch';
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse, ServerOptions } from "./Common"
import * as LocusLiveTracking from "./LocusLiveTracking";

//const tls = require('tls');
//tls.DEFAULT_MIN_VERSION = 'TLSv1.2';

type Server = http.Server;
const createServer = http.createServer;

const hostname = '0.0.0.0';
const port_http = 3000;
const port_https = 3443;


function serve (req: MyIncomingMessage, res: ServerResponse) {
	req.urlTab = req.url.split('/');
	req.urlTab.shift();
	const root = req.urlTab.shift();
	switch (root)
	{
		case "LocusLiveTracking":
			LocusLiveTracking.handle(req, res);
			break;
		default:
			res.statusCode = 404;
			res.setHeader('Content-Type', 'text/plain');
			res.end('Wrong query!\n');
			break;
	}
}

var options: ServerOptions = {
	key: fs.readFileSync('/etc/ssl/private/key.pem'),
	cert: fs.readFileSync('/etc/ssl/private/cert.pem')
}

const server_http: Server = createServer(serve);
server_http.listen(port_http, () => {
	console.log(`Server running at http://${hostname}:${port_http}/`);
});
const server_https: Server = createServer(options, serve);
server_https.listen(port_https, () => {
	console.log(`Server running at https://${hostname}:${port_https}/`);
});
