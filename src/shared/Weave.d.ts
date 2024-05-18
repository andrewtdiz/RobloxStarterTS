type StateObject<T> = {
	get(asDependency?: boolean): T;
	set(newValue: T, asDependency?: boolean): T;
};

type GetStateObject<T> = {
	getValue(): StateObject<T>;
};

type PlayerStateObject<T> = {
	getValue(): StateObject<T>;
	getNow(): T;
	getNowFor(player: Player): T;
	getFor(player: Player): T;
	Fusion: () => StateObject<T>;
	setFor(player: Player, newValue: T, force: boolean): void;
};

type WeaveValue<T> = StateObject<T> & GetStateObject<T>;
type WeavePlayerValue<T> = PlayerStateObject<T>;
type ProfileServiceValue<T> = PlayerStateObject<T>;
type WeaveObject<T> = StateObject<T> & GetStateObject<T>;

interface Weave {
	WeaveValue: <T>(eventName: string, initialValue: T) => WeaveValue<T>;
	WeaveList: <T>(eventName: string) => WeaveValue<T>;
	WeaveObject: <T>(eventName: string, initialValue: T) => WeaveObject<T>;
	WeavePlayerValue: <T>(eventName: string, initialValue: T) => WeavePlayerValue<T>;
	ProfileServiceValue: <T>(
		Weave: Weave,
		valueName: string,
		profileServiceKey: string,
		initialValue: T,
	) => WeavePlayerValue<T>;
	ProfileServiceObject: <T>(
		Weave: Weave,
		valueName: string,
		profileServiceKey: string,
		initialValue: T,
	) => ProfileServiceValue<T>;
	RemoteEvent(name: string): RemoteEvent | undefined;
	RemoteFunction(name: string): RemoteFunction | undefined;
	UnreliableRemoteEvent(name: string): UnreliableRemoteEvent | undefined;
	Connect<T>(name: string, handler: (args: T) => void): RBXScriptConnection;
	ConnectUnreliable<T>(name: string, handler: (args: T) => void): RBXScriptConnection;
	Handle<T>(name: string, handler: (player: Player, rest: T) => T): RBXScriptConnection;
	Invoke<T>(name: string, args: T): void;
	Clean: () => void;
}

// create a value from our type
declare const Weave: Weave;

export = Weave;
