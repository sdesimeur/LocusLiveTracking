import http from 'http';
import https from 'https';
import tls from 'tls';
//import * as FS from 'fs';
//import * as PATH from 'path';
//import { readFile, writeFile } from 'fs/promises';
//import { promises as fs } from 'fs';
import fs from 'fs-extra'
import fetch from 'node-fetch';
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse, ServerOptions } from "./Common"
import * as LocusLiveTracking from "./LocusLiveTracking";

//const tls = require('tls');
//tls.DEFAULT_MIN_VERSION = 'TLSv1.2';

type ServerHttp = http.Server;
type ServerHttps = http.Server;
const createServerHttp = http.createServer;
const createServerHttps = https.createServer;

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
	key: fs.readFileSync('/etc/letsencrypt/live/vps4.sd2.me/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/vps4.sd2.me/fullchain.pem')
}

const server_https: ServerHttps = createServerHttps(options, serve);
server_https.listen(port_https, () => {
	console.log(`Server running at https://${hostname}:${port_https}/`);
});

const server_http: ServerHttp = createServerHttp(serve);
server_http.listen(port_http, () => {
	console.log(`Server running at http://${hostname}:${port_http}/`);
});
/*
const server_http80: ServerHttp = createServerHttp(serve);
server_http80.listen(80, () => {
	console.log(`Server running at http://${hostname}:${port_http}/`);
});
*/
