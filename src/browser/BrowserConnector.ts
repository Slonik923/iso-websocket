import { Connection } from '../common/Connection';
import TypedEmitter from 'typed-emitter';

interface BrowserConnectorEvents
{

}

export class BrowserConnector extends ( EventTarget as new () => TypedEmitter<BrowserConnectorEvents> )
{
	private websocket: WebSocket;
	private connection: Connection;

	constructor( url: string | URL, connectData: Record<string, any> )
	{
		super();

		this.websocket = new WebSocket( url );
		this.connection = new Connection( this.websocket, null );
	}
}
