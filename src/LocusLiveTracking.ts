//import { uuids } from "./database/uuids";
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse } from "./Common"
import fs from 'fs'
import { getAllValues, getValue, setValue } from "node-global-storage";

var uuidStorage = undefined;

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
type UuidsDatas = MyMap<string, OneUuidData>;
type MyTree = { [key: string]: (string | Object) };
type MyFunc = (req: MyIncomingMessage, res: ServerResponse) => void;

//var uuids: UuidsDatas = new Map<string, OneUuidData>();
var dataTxt: string;
var datas: UuidsDatas = new MyMap<string, OneUuidData>();
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
		upload: undefined
	}
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
					//fs.unlinkSync('./database/uuids');
					//console.log(name + "\n");
				       	datas.set(name, {uuid: uuid, token: token});
					setValue<UuidsDatas>('uuids', datas);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'text/plain');
					//res.write(name + "\n");
					//res.write(inspect(uuids.get(name)) + "\n");
					res.end('Mail handled!\n');
				}
			}
		});
	},
	main: (req: MyIncomingMessage, res: ServerResponse) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.write(inspect(datas) + "\n");
		res.end('Mail handled!\n');

	}
}

function handleNext (req: MyIncomingMessage, res: ServerResponse, path: Object) {
		if (req.urlTab.length === 0) {
			noHandlePath(req, res);
		}
		const nextPath = req.urlTab.shift().toString();
		if (path[nextPath] !== undefined) {
			handleNext(req, res, path[nextPath]);
		} else {
			const func: MyFunc = handleFunction[nextPath];
			if (func === undefined) {
				noHandlePath(req, res);
			} else {
				func(req, res);
			}
		}
	}
	
//export default module "LocusLiveTracking" {
export function handle (req: MyIncomingMessage, res: ServerResponse) {
		handleNext(req, res, handlePath);
	}
//}
module.exports = { handle };
