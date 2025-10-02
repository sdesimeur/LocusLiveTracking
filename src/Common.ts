import http from 'http';
type IncomingMessage = http.IncomingMessage;
export type ServerResponse = http.ServerResponse;
export type ServerOptions = https.ServerOptions;
export type MyIncomingMessage = IncomingMessage & {urlTab : Array<String>} & {queryDatas : Map<string, string>};
