//!native
export type AnyArray<T = any> = Array<T> | ReadonlyArray<T>;
export type AnyMap<K = any, V = any> = Map<K, V> | ReadonlyMap<K, V>;

type ImmutableData = {} | AnyMap | AnyArray;
type MutableInterface<T extends {}> = {
	-readonly [key in keyof T]: T[key] extends ImmutableData ? Mutable<T[key]> : T[key];
};
type MutableMap<T extends AnyMap> =
	T extends AnyMap<infer K, infer V> ? Map<K, V extends ImmutableData ? Mutable<V> : V> : never;
type MutableArray<T extends AnyArray> =
	T extends AnyArray<infer V> ? Array<V extends ImmutableData ? Mutable<V> : V> : never;

declare global {
	type DefinedTable = DefinedMap | DefinedArray;
	type DefinedMap = Map<defined, defined>;
	type DefinedArray = Array<defined>;

	type Mutable<T extends ImmutableData> = T extends AnyMap
		? MutableMap<T>
		: T extends AnyArray
			? MutableArray<T>
			: T extends {}
				? MutableInterface<T>
				: never;
}
export namespace TableTools {
	/**
	 * clones the immutable data and executes the function with draft as argument
	 * @param data data to be cloned
	 * @param callback draft is a clone of the data with readonly flag removed
	 * @returns new changed copy of data (draft)
	 */
	export function CopyData<Data extends ImmutableData>(data: Data, callback: (draft: Mutable<Data>) => void): Data {
		//clones the data
		const clone = table.clone(data);
		callback(clone as Mutable<Data>);

		return clone;
	}

	export function DeepCopyData<Data extends ImmutableData>(
		data: Data,
		callback?: (draft: Mutable<Data>) => void,
	): Data {
		type RecursiveArray = Array<defined | RecursiveArray | RecursiveMap>;
		type RecursiveMap = Map<string, defined | RecursiveArray | RecursiveMap>;

		//clones the data
		const clone = table.clone(data) as unknown as RecursiveArray;
		if (IsArray(clone)) {
			//type is already array
			const cloned_table = clone;
			cloned_table.forEach((value, index) => {
				clone[index] = typeIs(value, "table") ? DeepCopyData(value) : value;
			});
		} else {
			//type is already array
			const cloned_table = clone as unknown as RecursiveMap;
			cloned_table.forEach((value, key) => {
				cloned_table.set(key, typeIs(value, "table") ? DeepCopyData(value) : value);
			});
		}

		if (callback) callback(clone as unknown as Mutable<Data>);

		return clone as Data;
	}

	/**returns the keys of the map */
	export function GetKeys<T extends AnyMap<K, V>, K extends defined, V extends defined>(map: T) {
		const keys = new Array<K>();
		for (const [key, _] of map) {
			keys.push(key);
		}
		return keys;
	}

	/**returns the values of the map */
	export function GetValues<T extends AnyMap<K, V>, K extends defined, V extends defined>(map: T) {
		const values = new Array<V>();
		for (const [_, value] of map) {
			values.push(value);
		}

		return values;
	}

	export function IsArray(data: DefinedTable) {
		return (data as DefinedMap).size() === (data as DefinedArray).size();
	}

	type RecursiveMap = Map<defined, defined | RecursiveMap>;
	export function ExtractElementsFromRecursiveData<Data extends ImmutableData>(
		data: Data,
		check: (element: defined, key: defined, taken_elements: Array<defined>, data: Data) => boolean,
		ignore_table_if_added: boolean = true,
	) {
		const taken_elements = new Array<defined>();
		const array = data as unknown as RecursiveMap;

		const CheckElement = (key: defined, element: defined) => {
			const is_table = typeIs(element, "table");
			const should_be_added = check(element, key, taken_elements, data);
			if (should_be_added) taken_elements.push(element);
			//ignore the table if it was added
			if (is_table && should_be_added && ignore_table_if_added) return;
			//extracts elements from the table recursively
			if (is_table) ExtractElements(element as RecursiveMap);
		};

		const ExtractElements = (array: RecursiveMap) => {
			for (const [key, element] of array) {
				CheckElement(key, element);
			}
		};

		ExtractElements(array);
		return taken_elements;
	}
}
