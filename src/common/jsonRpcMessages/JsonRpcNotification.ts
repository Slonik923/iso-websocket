import { JsonRpcRequest } from './JsonRpcRequest';

export type JsonRpcNotification = Omit<JsonRpcRequest, 'id'>;
