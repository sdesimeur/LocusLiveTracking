//import { uuids } from "./database/uuids";
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse } from "./Common"
import { LocalStorage } from 'node-localstorage';
import fs from 'fs'

var uuidStorage = undefined;

type MyTree = { [key: string]: (string | Object) };
type MyFunc = (req: MyIncomingMessage, res: ServerResponse) => void;

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
		        		var name = tmp1[2];
					//fs.unlinkSync('./database/uuids');
					uuidStorage = new LocalStorage('./database/uuids');
					var uuids = {}
					uuids[name] = {};
					uuids[name]['uuid'] = uuid;
					uuids[name]['token'] = token;
					uuidStorage = uuids;
					res.statusCode = 200;
					res.setHeader('Content-Type', 'text/plain');
					res.write(inspect(uuids) + "\n");
					res.end('Mail handled!\n');
				}
			}
		});
	},
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
