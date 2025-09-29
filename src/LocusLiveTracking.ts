import { uuids } from "./database/uuids";
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse } from "./Common"


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
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.write(inspect(uuids["clement"]) + "\n");
		res.end('Hello, world!\n');
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
