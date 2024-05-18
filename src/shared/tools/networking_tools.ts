import { Players } from "@rbxts/services";

export namespace NetworkingTools {
	export function FireAllClientsExcept(remote_event: RemoteEvent, exceptions: readonly Player[], ...args: unknown[]) {
		const players = Players.GetPlayers();
		players.forEach((player) => {
			if (exceptions.includes(player)) return;
			remote_event.FireClient(player, ...args);
		});
	}

	/**always returns true */
	function AlwaysTrue() {
		return true;
	}
	/**
	 * sends the data from one client directly to others
	 * sends the player who sent request and the arguments
	 * @param remote_event remote event that is going to be broadcasted to other clients
	 * @param check_arguments_callback checks if the client sends the valid information
	 */
	export function ResendToClientsConnection(
		remote_event: RemoteEvent,
		check_arguments_callback: (...args: unknown[]) => boolean = AlwaysTrue,
	) {
		//takes the arguments from the remote event and fires to all clients except of him
		return remote_event.OnServerEvent.Connect((player, ...args) => {
			//if didnt pass the check, dont send to other clients
			if (!check_arguments_callback(...args)) return;
			FireAllClientsExcept(remote_event, [player], player, ...args);
		});
	}
}
