import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';
import { NodeConnection } from './NodeConnection';
import { WebSocket } from 'ws';

interface NodeConnectorEvents
{

}

export class NodeConnector extends ( EventEmitter as new () => TypedEmitter<NodeConnectorEvents> )
{
	private connection: NodeConnection;

	constructor( url: string | URL, connectData: Record<string, any> )
	{
		super();

		const websocket = new WebSocket( url );
		this.connection = new NodeConnection( websocket as WebSocket, null );
	}
}
