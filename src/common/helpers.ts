import * as ws from 'ws';

export function isNode()
{
	return typeof window === 'undefined';
}

export type IsomorphicWs = WebSocket | ws.WebSocket;
