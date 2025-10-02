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

function returnKeyValObj(arr:Array<string>){
	if (!Array.isArray(arr) || arr.length < 2) return false;
	let propKey = '';
	const formDataEntries: {[key:string]:string} = {};
	const [pKey, ...pValArray] = arr;
	// pValArray[0] ends with \r\n (2 characters total)
	const propVal = pValArray[0].slice(0,-2)
	// pKey looks like '\r\nname=\"key\"', where \r and \n and \" count as one character each
	// So, need to remove 8 from start of pKey and 1 from end of pKey
	if (pKey && pKey.includes('name=\"')) propKey = pKey.slice(8).slice(0,-1);
	if (propKey) formDataEntries[propKey] = propVal;
	if (Object.keys(formDataEntries).length) return formDataEntries;
	return false;
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
			if (func !== handleFunction['pass'])
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
			for (const [key, value] of temp.entries()) {
				req.queryDatas.set(key, value);
			}
		}
		//if (req.method === "POST") {
		const headerContentType = req.headers['content-type'];
		if (headerContentType !== undefined && headerContentType.startsWith('multipart/form-data'))
		{
			const contentTypeHeader = req.headers["content-type"];
      			const boundary = "--" + contentTypeHeader.split("; ")[1].replace("boundary=","");
			const bodyParts = body.split(boundary);
			bodyParts.forEach((val:string) => {
          			// After name=.. there are 2 \r\n before the value - that's the only split I want
          			// So, the regex below splits at the first occurance of \r\n\r\n, and that's it
          			// This way, newlines inside texarea inputs are preserved
				const arrayStr = val.replace("Content-Disposition: form-data; ","").split(/\r\n\r\n(.*)/s);
				console.log(inspect(arrayStr));
				const formDataEntry = returnKeyValObj(arrayStr);
          			//if (formDataEntry) Object.assign(formDataSubmitted, formDataEntry);
			});
		} else {
			const temp = new URLSearchParams(body);
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
