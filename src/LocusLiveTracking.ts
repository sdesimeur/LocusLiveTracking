//import { uuids } from "./database/uuids";
import { inspect } from "util";
import { MyIncomingMessage, ServerResponse, MyTree } from "./Common";
import fs from 'fs-extra';
import { htpasswd } from "./htpasswd";
import {  buildGPX, BaseBuilder } from 'gpx-builder';
//import { Metadata, Point, Segment, Track, Route } from 'gpx-builder/src/Builder/BaseBuilder/models';

//import { getAllValues, getValue, setValue } from "node-global-storage";
const { create } = require('xmlbuilder2');
//const { parseXml } = require('libxmljs');
const url = require('url');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const multipart = require('parse-multipart-data');
//const { buildGPX, BaseBuilder } = require('gpx-builder');
const { Point, Track, Segment, Metadata } =  BaseBuilder.MODELS;

const namespace_locus = 'http://www.locusmap.eu';
const namespace_gpxtpx = 'http://www.garmin.com/xmlschemas/TrackPointExtension/v2';

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
type MyGroupOfTypes = string|Array<string>|OneUuidData;
type UuidsDatas = MyMap<string, MyGroupOfTypes>;
type MyFunc = (req: MyIncomingMessage, res: ServerResponse) => void;

//var uuids: UuidsDatas = new Map<string, OneUuidData>();
var dataTxt: string;
var datas: UuidsDatas = new MyMap<string, MyGroupOfTypes>();
if (fs.existsSync('./database/datas.json')) {
	dataTxt = fs.readFileSync('./database/datas.json', 'utf8');
	if (dataTxt !== undefined) {
		datas = new MyMap<string, MyGroupOfTypes>(Object.entries(JSON.parse(dataTxt)));
	}
}

if (datas['activities'] === undefined || datas['activities'] === null) {
	datas.set('activities', "");
}

function findKey(obj, target, max) {
	var l = 0;
	const fnd = o => {
		l++;
		if (l > max) return undefined;
		for (const [k, v] of Object.entries(o)) {
			if (k === target) {
				return v;
			}
	       		if (v !== undefined && v !== null && typeof v === 'object') {
				const f = fnd(v);
				if (f) return f;
			}
		}
		l--;
	}
	return fnd(obj);
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
	        		var name = tmp1[1].toLowerCase();
			       	datas.set(name, {uuid: uuid, token: token});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'text/plain');
				res.write("Mail handled !");
				res.end("\n");
			}
		}
	},
	main: async (req: MyIncomingMessage, res: ServerResponse) => {
		var lastActivity = datas.get('activities')[0];
		res.statusCode = 200;
		var pattern = new RegExp('.*<script\s*>[^{]*({[^<]*trackPoints[^<]*})[^}]*</script\s*>.*');
		var name = req.queryDatas.get('name').toLowerCase();
		var tmp10 = datas.get(name);
		var uuid = tmp10['uuid'];
		var token = tmp10['token'];
		var url = 'https://livetrack.garmin.com/session/' + uuid + '/token/' + token;
		var bodyStream = await fetch(url);
		var body = await bodyStream.text();
		body = fs.readFileSync('tmp/garmin_livetracking.txt', 'utf8');
		body = body.replaceAll("= ", "").replaceAll("\n", "").replaceAll("\r", "").replaceAll("\\", "");
		var tmp0 = body.match(pattern);
		var tmp0_1 = "";
		if (tmp0 === null || tmp0.length < 1) {
			//res.setHeader('Content-Type', 'text/plain');
			//res.write("tmp1 length :" + (tmp0===null)?0:tmp0.length);
			console.log("tmp1 length :" + (tmp0===null)?0:tmp0.length);
			tmp0_1 = fs.readFileSync('tmp/garmin_livetracking_json.txt', 'utf8');
		} else {
			tmp0_1 = tmp0[1];
			fs.writeFileSync('tmp/garmin_livetracking_json.txt', tmp0_1, {encoding : 'utf8'});
		}
			
		var tmp1 = tmp0_1.replaceAll('"[', "[").replaceAll(']"', "]").replaceAll("'[", "[").replaceAll("]'", "]")
		var tmp2 = JSON.parse(tmp1);
		var tmp3 = tmp2["state"]["queries"];
		//var tmp4 = findKey(tmp3, "trackPoints", 6).slice(0,5);
		var tmp4 = findKey(tmp3, "trackPoints", 6);
		fs.writeFileSync('tmp/garmin_datas.json', JSON.stringify(tmp4, null, 4), {encoding : 'utf8'});
		var trkpt = [];
		const gpxData = new BaseBuilder();
		var lastPt = tmp4.pop();
		var activities : Set<string> = new Set<string>((datas.get('activities')) as Array<string>);
		var pt;
		tmp4.forEach(e => {
			lastActivity = (new String(e.fitnessPointData.activityType)).toString().toLowerCase();
			activities.add(lastActivity);
			var ptopt = {
					'ele': e.altitude,
					'time': new Date(e.dateTime),
					'extensions': {
						'gpxtpx:TrackPointExtension': {
							'gpxtpx:hr': e.fitnessPointData.heartRateBeatsPerMin||0,
							'gpxtpx:cad': e.fitnessPointData.cadenceCyclesPerMin||0,
							'gpxtpx:course': e.fitnessPointData.distanceMeters||0,
							'gpxtpx:speed': e.fitnessPointData.speedMetersPerSec||0,
						}
					}
			};
			pt = new Point(
				e.position.lat,
				e.position.lon,
				ptopt
			);
			trkpt.push(pt);
		});
		var sym = "";
		switch (lastActivity) {
		case 'swimming':
			sym = 'sport-swim-outdoor';
			break;
		case 'running':
			sym = 'sport-hiking';
			break;
		case 'cycling':
			sym = 'sport-cyclingsport';
			break;
		default:
			sym = 'z-ico02';
			break;
		}
		var ptsList = [];
		var lastWpt = new Point(
			lastPt.position.lat,
			lastPt.position.lon,
			{
				name: name,
				sym: sym,
		       	}
		);
		ptsList.push(lastWpt);
		gpxData.setWayPoints(ptsList);
		datas.set('activities', Array.from(activities.values()));
		var trkseg = new Segment(
			trkpt,
		);
		var trksegs = [];
		trksegs.push(trkseg);
		var lineExts = {
			color: 'FF0000', opacity: 0.78, width: 3.0
		};

		//var trkExts = {'line xmlns:"http://www.topografix.com/GPX/gpx_style/0/2"': lineExts};
		var trkExts = {'line' : lineExts, 'locus:activity': lastActivity};
		var trk = new Track(
			trksegs,
			{ 
				name: name + "Trk",
				extensions: trkExts,
			}
		);
		var trks = [];
		trks.push(trk);
		gpxData.setTracks(trks);
		res.setHeader('Content-Type', 'application/gpx+xml');
		var xmlObj = gpxData.toObject();
		//xmlObj.attributes['xsi:schemaLocation'] = "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd";
	       	//xmlObj.attributes['xmlns'] = "http://www.topografix.com/GPX/1/1";
		//xmlObj.attributes['xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance";
		xmlObj.attributes['xmlns:locus'] = "http://www.locusmap.eu";
	       	xmlObj.attributes['xmlns:gpxx'] = "http://www.garmin.com/xmlschemas/GpxExtensions/v3";
		xmlObj.attributes['xmlns:gpxtrkx'] = "http://www.garmin.com/xmlschemas/TrackStatsExtension/v1";
		xmlObj.attributes['xmlns:gpxtpx'] = "http://www.garmin.com/xmlschemas/TrackPointExtension/v2";
		var lineObj1 = {'attributes': {'xmlns': "http://www.topografix.com/GPX/gpx_style/0/2"}}
		var lineObj2 = xmlObj.trk[0].extensions.line;
		var lineObj3 = { 'extensions':  {
		       	'attributes': lineObj1.attributes,
			'locus:lsColorBase': 'C8FF0000',
			'locus:lsWidth': 3.0,
			'locus:lsUnits': 'PIXELS'},
		};
		Object.assign(lineObj2, lineObj1, lineObj3); 
		Object.assign(lineObj2.extensions, lineObj1);
		//linetmp['attributes'] = {'xmlns': "http://www.topografix.com/GPX/gpx_style/0/2"};
		//Object.replace(xmlObj.trk[0].extensions.line, lineObj2);
		//res.write(inspect(xmlObj) + "\n");
		res.write(inspect(xmlObj.trk[0].trkseg[0].extensions) + "\n");

		//xmlObj.trk[0].extensions.line = {};
		//Object.assign(xmlObj.trk[0].extensions.line, lineObj2);

		res.write(buildGPX(xmlObj));
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
