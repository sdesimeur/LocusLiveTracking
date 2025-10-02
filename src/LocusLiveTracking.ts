//import { uuids } from "./database/uuids";
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse } from "./Common"
import fs from 'fs'
//import { getAllValues, getValue, setValue } from "node-global-storage";
const url = require('url');
const bodyParser = require('body-parser');
const querystring = require('querystring');

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
type MyTree = { [key: string]: (string | Object) };
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
let handlePath = {
	admin : {
		upload: null,
		pass: null,
	},
	main : null,
}

let handleFunction: {[key: string]: MyFunc} = {
	upload: (req: MyIncomingMessage, res: ServerResponse) => {
		let body = '';
		req.on('data', (chunk) => {
        		body += chunk;
    		});
    		req.on('end', () => {
			const expreg0  = new RegExp('https://livetrack\.garmin\.com/session/([a-f0-9\-]{36})/token/([0-9A-Fa-f]*)[^0-9a-fA-F]', 'i');
			body = body.replaceAll('= ', '').replaceAll("\r", '').replaceAll("\n", '');
			const tmp0 = body.match(expreg0);
			if (tmp0.length < 2) {
				console.log(tmp0.length)
				noHandlePath(req, res);
			} else {
	        		var uuid = tmp0[1];
	        		var token = tmp0[2];
				const expreg1  = new RegExp('jour Livetrack de ([0-9a-zA-Z]*) *\.', 'i');
				const tmp1 = body.match(expreg1);
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
		});
	},
	main: (req: MyIncomingMessage, res: ServerResponse) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.write(inspect(datas));
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
			func(req, res);
		}
	}
}

//export default module "LocusLiveTracking" {
export function handle (req: MyIncomingMessage, res: ServerResponse) {
	let body = '';
	req.on('data', (chunk) => {
        	body += chunk;
    	});
    	req.on('end', () => {
		//console.log(inspect(req));
		var pass: string = undefined;
		req.queryDatas = new Map<string, string>();
		const urlDatas = url.parse(req.url);
		if (urlDatas.query !== undefined && urlDatas.query !== null) {
			//const temp = querystring.parse(urlDatas.query);
			const temp = new URLSearchParams(urlDatas.query);
			console.log(inspect(temp));
			for (const [key, value] of temp.entries()) {
				req.queryDatas.set(key, value);
			}
		}
		//if (req.method === "POST") {
			const temp = new URLSearchParams(body);
			for (const [key, value] of temp.entries()) {
					req.queryDatas.set(key, value);
			}
		//}
		handleNext(req, res, handlePath);
	});
}
//}
module.exports = { handle };
