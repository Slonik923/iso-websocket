import { JsonRpcMessage } from './jsonRpcMessages/JsonRpcMessage';

export interface IWebSocketConnectionEvents
{
	open( data: Record<string, any> ): void;
	close( code: number, reason: string ): void;
	message( message: JsonRpcMessage ): void;
	error( error: unknown ): void;
}

