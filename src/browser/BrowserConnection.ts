import { Connection } from '../common/Connection';
import { IsomorphicWs } from '../common/helpers';
import { BaseEvent, TypedEventTarget } from './TypedEventTarget';

interface OpenEvent extends BaseEvent
{
	readonly type: 'open'
}

interface MessageEvent extends BaseEvent
{
	readonly type: 'message',
	readonly message: Record<string, any>
}

interface CloseEvent extends BaseEvent
{
	readonly type: 'close',
	readonly code: number,
	readonly reason: string
}

interface ErrorEvent extends BaseEvent
{
	readonly type: 'error',
	readonly error: unknown
}

type BrowserConnectionEvents = OpenEvent | MessageEvent | CloseEvent | ErrorEvent;

export class BrowserConnection extends TypedEventTarget<BrowserConnectionEvents>
{
	private connection: Connection;

	constructor( websocket: WebSocket, connectionData: Record<string, any> )
	{
		super();

		this.connection = new Connection( websocket as IsomorphicWs, connectionData );
		this.connection.onOpen = ( data ) => this.dispatch( { type: 'open' } );
		this.connection.onClose = ( code, reason ) => this.dispatch( { type: 'close', code, reason } );
		this.connection.onMessage = ( message ) => this.dispatch( { type: 'message', message } );
		this.connection.onError = ( error ) => this.dispatch( { type: 'error', error } );
	}
}
