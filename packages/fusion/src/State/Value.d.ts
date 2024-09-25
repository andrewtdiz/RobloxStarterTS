export declare interface Value<T> {
	type: "State";
	kind: "Value";
	/**
	 * Returns the value currently stored in this State object.
	 * The state object will be registered as a dependency unless `asDependency` is
	 * false.
	 */
	get(asDependency?: boolean): T;
	/**
	 * A callback function to update the value stored in this State object.
	 *
	 * If `force` is enabled, this will skip equality checks and always update the
	 * state object and any dependents - use this with care as this can lead to
	 * unnecessary updates.
	 */
	update(func: (t: T) => T | undefined, force?: boolean): void;
	/**
	 * Removes a value stored in this State (table) object.
	 *
	 * If `force` is enabled, this will skip equality checks and always update the
	 * state object and any dependents - use this with care as this can lead to
	 * unnecessary updates.
	 */
	remove(value: T, force?: boolean): void;
	/**
	 * Inserts a value stored in this State (table) object.
	 *
	 * If `force` is enabled, this will skip equality checks and always update the
	 * state object and any dependents - use this with care as this can lead to
	 * unnecessary updates.
	 */
	insert(value: T, force?: boolean): void;
	/**
	 * Deletes a key stored in this State (table) object.
	 *
	 * If `force` is enabled, this will skip equality checks and always update the
	 * state object and any dependents - use this with care as this can lead to
	 * unnecessary updates.
	 */
	delete(value: T, force?: boolean): void;
	/**
	 * Updates the value stored in this State object.
	 *
	 * If `force` is enabled, this will skip equality checks and always update the
	 * state object and any dependents - use this with care as this can lead to
	 * unnecessary updates.
	 */
	set(value: T, force?: boolean): void;
}
/**
 * Constructs and returns objects which can be used to model independent
 * reactive state.
 */
export declare function Value<T>(initialValue: T): Value<T>;
