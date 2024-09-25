import { Value } from "@rbxts/fusion";

interface Weave {
	WeaveValue: <T>(eventName: string) => Value<T>;
	WeaveList: <T>(eventName: string) => Value<T>;
	WeavePlayerValue: <T>(eventName: string) => Value<T>;
	ProfileServiceValue: <T>(Weave: Weave, valueName: string) => Value<T>;
	ProfileServerValue: <T>(Weave: Weave, valueName: string) => Value<T>;
	ProfileServiceObject: <T>(Weave: Weave, valueName: string) => Value<T>;
	ProfileZapValue: <T>(Weave: Weave, valueName: string) => Value<T>;
	ZapPlayerValue: <T>(Weave: Weave, valueName: string) => Value<T>;
	RemoteEvent(name: string): RemoteEvent;
	RemoteFunction(name: string): RemoteFunction;
	UnreliableRemoteEvent(name: string): UnreliableRemoteEvent;
	Connect<T>(name: string, handler: (args: T) => void): RBXScriptConnection;
	ConnectUnreliable<T>(name: string, handler: (args: T) => void): RBXScriptConnection;
	Handle<T>(name: string, handler: (player: Player, rest: T) => T): RBXScriptConnection;
	Invoke<T>(name: string, args: T): void;
	Clean: () => void;
}

declare const WeaveClient: Weave;

export = WeaveClient;
