//import { uuids } from "./database/uuids";
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse, MyTree } from "./Common";
import fs from 'fs';
import { htpasswd } from "./htpasswd";

//import { getAllValues, getValue, setValue } from "node-global-storage";
const url = require('url');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const multipart = require('parse-multipart-data');

class MyMap<K, V> extends Map <K, V> {
	set(key: K, value: V): this {
		super.set(key, value);
		const txt: string = JSON.stringify(Object.fromEntries(this));
		fs.writeFileSync('./database/datas.json', txt, {encoding :'utf8', flag: 'w', flush: true});
		return this;
	}
}

type OneUuidData = {uuid: string, token: string};
//type UuidsDatas = Record<string, OneUuidData>;
type UuidsDatas = MyMap<string, (OneUuidData|string)>;
type MyFunc = (req: MyIncomingMessage, res: ServerResponse) => void;

//var uuids: UuidsDatas = new Map<string, OneUuidData>();
var dataTxt: string;
var datas: UuidsDatas = new MyMap<string, (OneUuidData|string)>();
if (fs.existsSync('./database/datas.json')) {
	dataTxt = fs.readFileSync('./database/datas.json', 'utf8');
	if (dataTxt !== undefined) {
		datas = new MyMap<string, OneUuidData>(Object.entries(JSON.parse(dataTxt)));
	}
}

function noHandlePath (req: MyIncomingMessage, res: ServerResponse) {
	res.statusCode = 404;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Wrong query!\n');
}

function badAuthentication (req: MyIncomingMessage, res: ServerResponse) {
	res.statusCode = 401;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Bad Authentication!\n');
}

let handlePath = {
	admin : {
		upload: null,
		pass: null,
	},
	main : null,
}

let handleFunction: {[key: string]: MyFunc} = {
	upload: async (req: MyIncomingMessage, res: ServerResponse) => {
		var header = req.headers.authorization || '';
		var token = header.split(/\s+/).pop() || '';
		var auth = Buffer.from(token, 'base64').toString(); // convert from base64
		var parts = auth.split(/:/);                        // split on colon
		var username = parts.shift();                       // username is first
		var password = parts.join(':');                     // everything else is the password
		if (username !== htpasswd[0].username || password !== htpasswd[0].password) {
			badAuthentication(req, res);
			return;
		}
		const expreg0  = new RegExp('https://livetrack\.garmin\.com/session/([a-f0-9\-]{36})/token/([0-9A-Fa-f]*)[^0-9a-fA-F]', 'i');
		req.body = req.body.replaceAll('= ', '').replaceAll("\r", '').replaceAll("\n", '');
		var tmp0 = req.body.match(expreg0);
		var name: string = "";
		var uuid: string = "";
		var token: string = "";
		if (tmp0.length < 2) {
			console.log(tmp0.length)
			noHandlePath(req, res);
			return;
		} else {
        		var uuid = tmp0[1];
        		var token = tmp0[2];
			var expreg1  = new RegExp('jour Livetrack de ([0-9a-zA-Z]*) *\.', 'i');
			var tmp1 = req.body.match(expreg1);
			if (tmp1.length < 1)
			{
				console.log(tmp1.length)
				noHandlePath(req, res);
			} else {
	        		var name = tmp1[1];
			       	datas.set(name, {uuid: uuid, token: token});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'text/plain');
				res.write("Mail handled !");
				res.end("\n");
			}
		}
		//var name1 = req.queryDatas.get('name');
		//var tmp2 = datas.get(name1);
		//var uuid = tmp2['uuid'];
		//var token = tmp2['token'];
		var url = 'https://livetrack.garmin.com/session/' + uuid + '/token/' + token;
		var bodyStream = await fetch(url);
		var body = await bodyStream.text();
		fs.writeFileSync('tmp/garmin_livetracking.txt', body);
	},
	main: async (req: MyIncomingMessage, res: ServerResponse) => {
		res.statusCode = 200;
		var pattern = new RegExp('.*<script\s*>[^{]*({[^<]*trackPoints[^<]*})[^}]*</script\s*>.*');
		var url = 'tmp/garmin_livetracking.txt';
		var body = fs.readFileSync(url, 'utf8');
		body = body.replaceAll("= ", "").replaceAll("\n", "").replaceAll("\r", "");
		/*
		var bodytab = body.split('<script\s*')
		bodytab.forEach(element => {
			if (element.includes('trackPoints')) {
				console.log(element);
			}
		})
	        */
		var tmp0 = body.match(pattern);
		if (tmp0 === null || tmp0.length < 1) {
			res.setHeader('Content-Type', 'text/plain');
			res.write(inspect(datas));
		} else {
			console.log(tmp0[1]);
			res.setHeader('Content-Type', 'application/gpx+xml');
		}
		res.end('\n');
	},
	pass: (req: MyIncomingMessage, res: ServerResponse) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
		const pass = req.queryDatas.get('pass');
		if (pass !== undefined && pass !== null)
		{
			res.write("Password changed!");
			datas.set('pass', pass);
		} else {
			res.write("No password found!");
		}
		res.end('\n');
/*
	<html lang="fr">
	<head>
		<meta charset="UTF-8">
		<title>Demande d'Identifiant</title>
	</head>
	<body>
		<h1>Veuillez entrer votre pass</h1>
		<!-- Le formulaire HTML pour entrer l'pass -->
		<form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
			<label for="pass">Password:</label>
			<input type="text" id="pass" name="pass" required>
			<button type="submit">Envoyer</button>
		</form>
	</body>
	</html>
*/
	}
}

function handleNext (req: MyIncomingMessage, res: ServerResponse, path: Object) {
	if (req.urlTab.length === 0) {
		noHandlePath(req, res);
	}
	const nextPath = req.urlTab.shift().split('?')[0].toString();
	if (path[nextPath] === undefined) {
		noHandlePath(req, res);
	} else {
		const func: MyFunc = handleFunction[nextPath];
		if (func === undefined) {
			handleNext(req, res, path[nextPath]);
		} else {
			if (func !== handleFunction['pass'] && func !== handleFunction['upload'])
			{
				if (req.queryDatas.get('pass') != datas.get('pass')) {
					res.statusCode = 404;
					res.setHeader('Content-Type', 'text/plain');
					res.end('Wrong password!\n');
					return;
				}
			}
			func(req, res);
		}
	}
}

//export default module "LocusLiveTracking" {
export function handle (req: MyIncomingMessage, res: ServerResponse) {
	req.body = '';
	req.on('data', (chunk) => {
        	req.body += chunk;
    	});
    	req.on('end', () => {
		//console.log(inspect(req));
		var pass: string = undefined;
		req.queryDatas = new Map<string, string>();
		const urlDatas = url.parse(req.url);
		if (urlDatas.query !== undefined && urlDatas.query !== null) {
			//const temp = querystring.parse(urlDatas.query);
			const temp = new URLSearchParams(urlDatas.query);
			for (const [key, value] of temp.entries()) {
				req.queryDatas.set(key, value);
			}
		}
		//if (req.method === "POST") {
		const headerContentType = req.headers['content-type'];
		if (headerContentType !== undefined && headerContentType.startsWith('multipart/form-data'))
		{
      			const boundary = multipart.getBoundary(req.headers["content-type"]);;
			const parts = multipart.parse(Buffer.from(req.body), boundary);
			parts.forEach(element => {
				req.queryDatas.set(element.name, element.data.toString());
			});
			
		} else {
			const temp = new URLSearchParams(req.body);
			for (const [key, value] of temp.entries()) {
				req.queryDatas.set(key, value);
			}
		}
		//}
		handleNext(req, res, handlePath);
	});
}
//}
module.exports = { handle };
