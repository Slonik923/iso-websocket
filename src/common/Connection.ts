import * as ws from 'ws';

import { JsonRpcResponse } from './jsonRpcMessages/JsonRpcResponse';
import { JsonRpcError } from './jsonRpcMessages/JsonRpcError';
import { JsonRpcMessage } from './jsonRpcMessages/JsonRpcMessage';
import { JsonRpcRequest } from './jsonRpcMessages/JsonRpcRequest';
import { JsonRpcNotification } from './jsonRpcMessages/JsonRpcNotification';
import { isNode, IsomorphicWs } from './helpers';

export class Connection
{
	private messages: string[] = []; // buffer for messages that failed to be send
	private requests = new Map<number, {
		resolve:( response: JsonRpcResponse ) => void;
		reject: ( error: JsonRpcError ) => void;
	}>();

	// TODO: onOpen got some data?
	public onOpen: ( data: Record<string, any> ) => void;
	public onClose: ( code: number, reason: string ) => void;
	public onMessage: ( message: JsonRpcMessage ) => void;
	public onError: ( error: unknown ) => void;

	public constructor( private websocket: IsomorphicWs, private readonly connectData: Record<string, any> )
	{
		if ( isNode() )
		{
			const ws: ws.WebSocket = this.websocket as ws.WebSocket;
			ws.on( 'open', () =>
			{
				return this.websocketOnOpen();
			} );

			ws.on( 'message', ( buffer: Buffer ) =>
			{
				const data = buffer.toString();
				const message: JsonRpcMessage = JSON.parse( data );

				return this.websocketOnMessage( message );
			} );

			ws.on( 'close', ( code, buffer: Buffer ) =>
			{
				const reason = buffer.toString();

				return this.websocketOnClose( code, reason );
			} );

			ws.on( 'error', ( event ) =>
			{
				return this?.onError( event );
			} );
		}
		else
		{
			const ws: WebSocket = this.websocket as WebSocket;
			ws.addEventListener( 'open', ( event ) =>
			{
				return this.websocketOnOpen();
			} );

			ws.addEventListener( 'message', ( event ) =>
			{
				const message: JsonRpcMessage = JSON.parse( event.data );

				return this.websocketOnMessage( message );
			} );

			ws.addEventListener( 'close', ( event ) =>
			{
				const {code, reason} = event;

				return this.websocketOnClose( code, reason );
			} );

			ws.addEventListener( 'error', ( event ) =>
			{
				return this?.onError( event )
			} );
		}
	}

	private async websocketOnOpen(): Promise<void>
	{
		try
		{
			const { url } = this.websocket;

			console.log( `WebSocket connected to '${url}'` );

			console.log( `${this.messages.length} cached messages` );

			const response = await this.call( 'connect', this.connectData );

			console.log( 'connect response', response );

			// TODO: test this
			let message: string = this.messages.pop();
			while( message )
			{
				this.websocket.send( message );

				// console.log( 'Sent message', message );

				// Remove once successfully sent
				this.messages.shift();

				message = this.messages.pop();
			}

			this?.onOpen( null );
		}
		catch( error )
		{
			// TODO: error handling: https://www.jsonrpc.org/specification
			console.error( 'Failed to send message', error );
		}
	}

	private websocketOnMessage( message: JsonRpcMessage ): void
	{
		try
		{
			if( 'id' in message && this.requests.has( message.id ) )
			{
				const request = this.requests.get( message.id );
				const response = message as JsonRpcResponse;
				if( response.error )
				{
					request.reject( response.error );
				}
				else
				{
					request.resolve( response );
				}
			}
			else
			{
				// TODO validate jsonrpc
				this.onMessage( message );
			}
		}
		catch( error: any )
		{
			console.error( 'Failed to receive message', error );
		}
	}

	private websocketOnClose( code: number, reason: string ): void
	{
		this?.onClose( code, reason );

		setTimeout( () =>
		{
			const { url } = this.websocket;

			// TODO: reconnects
			//this.websocket = this.connect( url );
		}, 3000 ); // TODO Implement backoff
	}

	private send( message: string ): void
	{
		try
		{
			this.websocket.send( message );
		}
		catch ( error )
		{
			console.warn( 'Failed to send message. Adding to queue!', error );

			// TODO Implement some sort of limit and once reached, invoke full snapshot on reconnect
			this.messages.push( message );
		}
	}

	public createRequest( method: string, params?: Record<string, unknown> ): JsonRpcRequest
	{
		const id = Math.random();

		const request: JsonRpcRequest =
			{
				jsonrpc: '2.0',
				id,
				method
			};

		if( params )
		{
			request.params = params;
		}

		return request;
	}

	public createResponse(
		request: JsonRpcRequest | JsonRpcResponse,
		result?: Record<string, unknown>
	): JsonRpcResponse
	{
		const { id } = request;

		if( !id )
		{
			throw new Error( 'Cannot create response from notification (no id).' );
		}

		const response: JsonRpcResponse =
			{
				jsonrpc: '2.0',
				id
			};

		if( result )
		{
			response.result = result;
		}

		return response;
	}

	public createNotification( method: string, params?: Record<string, unknown> ): JsonRpcNotification
	{
		const notification: JsonRpcNotification =
			{
				jsonrpc: '2.0',
				method
			};

		if( params )
		{
			notification.params = params;
		}

		return notification;
	}

	public sendRequest( request: JsonRpcRequest ): Promise<JsonRpcResponse>
	{
		const encoded = JSON.stringify( request );

		return new Promise<JsonRpcResponse>( ( resolve, reject ) =>
		{
			const { id } = request;

			if( !id )
			{
				throw new Error( '\'id\' missing from request.' );
			}

			this.send( encoded );

			this.requests.set( id, {
				resolve,
				reject
			} );
		} );
	}

	public sendResponse( response: JsonRpcResponse ): void
	{
		const encoded = JSON.stringify( response );

		this.send( encoded );
	}

	public sendNotification( notification: JsonRpcNotification ): void
	{
		const encoded = JSON.stringify( notification );

		this.send( encoded );
	}

	public call( method: string, params?: Record<string, unknown> ): Promise<JsonRpcResponse>
	{
		const request = this.createRequest( method, params );

		return this.sendRequest( request );
	}

	public notify( method: string, params?: Record<string, unknown> ): void
	{
		const notification = this.createNotification( method, params );

		this.sendNotification( notification );
	}

	public respond( request: JsonRpcRequest | JsonRpcResponse, result?: Record<string, unknown> ): void
	{
		const response = this.createResponse( request, result );

		this.sendResponse( response );
	}

	public error( request: JsonRpcRequest | JsonRpcResponse, code: number, message: string )
	{
		const error: JsonRpcError = {
			code,
			message
		};

		this.respond( request, error as Record<string, any> );
	}
}
