import { Value } from "@rbxts/fusion";

type StateObject<T> = Value<T>;

type GetStateObject<T> = {
	getValue(): StateObject<T>;
};

type PlayerStateObject<T> = {
	getValue(): StateObject<T>;
	getNow(): T;
	getNowFor(player: Player): T;
	getFor(player: Player): T;
	Fusion: () => StateObject<T>;
	setFor(player: Player, newValue: T, force?: boolean): void;
};

type WeaveValue<T> = StateObject<T> & GetStateObject<T>;
type WeavePlayerValue<T> = PlayerStateObject<T>;

interface Weave {
	WeaveValue: <T>(eventName: string, initialValue: T) => WeaveValue<T>;
	WeavePlayerValue: <T>(eventName: string, initialValue: T) => WeavePlayerValue<T>;
	ProfileServiceValue: <T, K>(valueName: string, profileServiceKey: K) => WeavePlayerValue<T>;
	ProfileServerValue: <T, K>(valueName: string, profileServiceKey: K) => WeavePlayerValue<T>;
	ProfileServiceObject: <T, K>(valueName: string, profileServiceKey: K) => WeavePlayerValue<T>;
	ProfileZapValue: <T>(
		valueName: string,
		zapEventName: string,
		profileServiceKey: string,
		initialValue: T,
	) => WeavePlayerValue<T>;
	ZapPlayerValue: <T>(Weave: Weave, valueName: string, zapEventName: string, initialValue: T) => WeavePlayerValue<T>;
	RemoteEvent(name: string): RemoteEvent;
	RemoteFunction(name: string): RemoteFunction;
	UnreliableRemoteEvent(name: string): UnreliableRemoteEvent;
	Connect<T>(name: string, handler: (args: T) => void): RBXScriptConnection;
	ConnectUnreliable<T>(name: string, handler: (args: T) => void): RBXScriptConnection;
	Handle<T>(name: string, handler: (player: Player, rest: T) => T): RBXScriptConnection;
	Invoke<T>(name: string, args: T): void;
	Clean: () => void;
}

declare const WeaveServer: Weave;

export = WeaveServer;
