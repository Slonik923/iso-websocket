import { Server, ServerOptions, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter'
import Timeout = NodeJS.Timeout;

import { NodeConnection } from './NodeConnection';

interface ConnectionState
{
	isAlive: boolean;
	interval: Timeout;
}

interface WebSocketServerEvents
{
	connection( connection: NodeConnection, data: Record<string, any> ): void;
}

export class WebsocketServer extends (EventEmitter as new () => TypedEmitter<WebSocketServerEvents>)
{
	private webSocketServer: Server;
	private connectionStates: Map<WebSocket, ConnectionState> = new Map();

	constructor( host: string, port: number, additionalOptions?: ServerOptions )
	{
		super();

		this.webSocketServer = this.createWsServer( host, port, additionalOptions );
	}

	protected createWsServer( host: string, port: number, additionalOptions?: ServerOptions )
	{
		const options = {
			host,
			port,
			...additionalOptions
		};

		const webSocketServer = new WebSocket.Server( options );

		webSocketServer.on(
			'connection',
			( websocket: WebSocket, request: IncomingMessage ) => this.webSocketServerOnConnection( websocket, request )
		);
		webSocketServer.on( 'listening', () => this.webSocketServerOnListening( port ) );
		webSocketServer.on( 'error', ( error: Error ) => this.webSocketServerOnError( error ) );

		return webSocketServer;
	}

	protected webSocketServerOnConnection( websocket: WebSocket, request: IncomingMessage ): void
	{
		console.log( 'Incoming WebSocket connection', request.url );

		const interval = setInterval( () =>
		{
			const state = this.connectionStates.get( websocket );
			if( state && !state.isAlive )
			{
				websocket.terminate();
			}

			websocket.ping();
		}, 30000 );

		interval.unref();

		this.connectionStates.set( websocket, { isAlive: true,
			interval: interval } );

		// TODO: heartbeat
		//websocket.on( 'pong', heartbeat );

		const connection = new NodeConnection( websocket, null );

		connection.on( 'open', ( data ) =>
		{
			console.log( 'Web recorded connected', data );

			this.onOpenConnection( connection, data );
		} );

		// TODO: heartbeat
		//connection.on( 'message', heartbeat );

		connection.on( 'close', () =>
		{
			const state = this.connectionStates.get( websocket );

			state.isAlive = false;
			clearInterval( state.interval );

			this.connectionStates.delete( websocket );
		} );
	}

	protected onOpenConnection( connection: NodeConnection, data: Record<string, any> )
	{
		this.emit( 'connection', connection, data );
	}

	protected webSocketServerOnListening( port: number ): void
	{
		console.log( `WebSocket server listening on port '${port}'` );
	}

	protected webSocketServerOnError( error:Error ): void
	{
		console.log( 'WebSocket server error', error );
	}
}
