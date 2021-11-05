import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { Connection } from '../common/Connection';
import { IsomorphicWs } from '../common/helpers';
import { IWebSocketConnectionEvents } from '../common/IWebSocketConnectionEvents';

export class NodeConnection extends ( EventEmitter as new () => TypedEmitter<IWebSocketConnectionEvents> )
{
	private connection: Connection;

	constructor( websocket: WebSocket, connectionData: Record<string, any> )
	{
		super();

		this.connection = new Connection( websocket as IsomorphicWs, connectionData );
		this.connection.onOpen = ( data ) => this.emit( 'open', data );
		this.connection.onClose = ( code, reason ) => this.emit( 'close', code, reason );
		this.connection.onMessage = ( message ) => this.emit( 'message', message );
		this.connection.onError = ( error ) => this.emit( 'error', error );
	}
}
