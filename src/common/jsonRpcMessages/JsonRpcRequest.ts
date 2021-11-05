import { JsonRpcMessage } from './JsonRpcMessage';

export interface JsonRpcRequest extends JsonRpcMessage
{
	method: string,
	params?:
		{
			[ key: string ]: any;
		}
}
