import { JsonRpcMessage } from './JsonRpcMessage';
import { JsonRpcError } from './JsonRpcError';

export interface JsonRpcResponse extends JsonRpcMessage
{
	result?: string |
		{
			[key: string]: any;
		};
	error?: JsonRpcError;
}
