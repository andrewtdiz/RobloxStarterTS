//!native
import { RunService } from "@rbxts/services";

export namespace FunctionTools {
	export function ExecuteIfClient<T extends unknown[], ReturnType>(callback: (...args: T) => ReturnType, ...args: T) {
		if (RunService.IsClient()) return callback(...args);
	}
	export function ExecuteIfServer<T extends unknown[], ReturnType>(callback: (...args: T) => ReturnType, ...args: T) {
		if (RunService.IsServer()) return callback(...args);
	}
	/**executes client call back for the client and server callback for the server, returns the callback return arguments */
	export function ExecuteOnServerAndClient<T extends unknown[], ReturnType>(
		server_callback: (...args: T) => ReturnType,
		client_callback: (...args: T) => ReturnType,
		...args: T
	): ReturnType {
		if (RunService.IsServer()) return server_callback(...args);
		return client_callback(...args);
	}
	export function Execute<T extends unknown[], ReturnType>(callback: (...args: T) => ReturnType, ...args: T) {
		return callback(...args);
	}
	/**
	 *
	 * @param value value to switch
	 * @param possible_variants possible variants of value
	 * @param possible_answers possible answers with coresponding indexes to variants
	 * @param default_value if variant wasnt found, will return a default value
	 * @returns if value is a variant, will return the answer with the same index as a variant
	 */
	export function SwitchValueIfEquals<T, Q>(
		value: T,
		possible_variants: T[],
		possible_answers: Q[],
		default_value: Q,
	) {
		for (const i of $range(0, possible_answers.size() - 1)) {
			const variant = possible_variants[i];
			//if value is a variant, will return the answer with the same index
			if (value === variant) return possible_answers[i];
		}
		return default_value;
	}
}
