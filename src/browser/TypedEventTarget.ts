export interface BaseEvent
{
	type: string
	data?: unknown
}

export class TypedEventTarget<E extends BaseEvent> extends EventTarget
{
	public dispatchEvent( e: Event & E ): boolean
	{
		return super.dispatchEvent( e );
	}

	public dispatch( e: E ): boolean
	{
		const event = Object.assign( new Event( e.type ), e );

		return this.dispatchEvent( event );
	}

	public addEventListener<
		T extends E['type'],
		E extends E & { type: T }
		>( type: T, listener: ( ( e: Event & E ) => boolean ) | null )
	{
		super.addEventListener( type, listener );
	}

	public removeEventListener( type: E['type'] )
	{
		super.removeEventListener( type, null );
	}
}
