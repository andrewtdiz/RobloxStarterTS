export namespace DebuggingTools {
	type DefinedTable = DefinedMap | DefinedArray;
	type DefinedMap = Map<defined, defined>;
	type DefinedArray = Array<defined>;

	export namespace JSONAnalizer {
		type RecursiveTable = Map<string, [(string | RecursiveTable)[], boolean]>;
		function AddToRecursiveTable(origin_table: RecursiveTable, new_table: RecursiveTable) {
			for (const [key, value] of new_table) {
				let tuple = origin_table.get(key);
				//0 - types
				const new_types = value[0];
				if (tuple === undefined) {
					//sets to true to mark as optional because didnt exist in origin_table
					tuple = [new_types, true];
					//sets the new tuple
					origin_table.set(key, tuple);
					continue;
				}

				//0 - types
				const origin_types = tuple[0];

				for (const type_name of new_types) {
					if (typeIs(type_name, "string")) {
						if (origin_types.includes(type_name)) continue;
						//pushes to types if doesnt exist
						origin_types.push(type_name);
						continue;
					}
					const origin_table_2 = FindFirstTable<RecursiveTable>(origin_types);
					if (origin_table_2 === undefined) {
						//adds the table if doesnt exist
						origin_types.push(type_name);
						continue;
					}
					AddToRecursiveTable(origin_table_2, type_name);
				}
			}

			//all different keys were applied
			const different_keys = GetDifferentKeys(origin_table, new_table);
			for (const key of different_keys) {
				const tuple = origin_table.get(key)!;
				//marks previously missing keys as optional
				tuple[1] = true;
			}
		}

		function AnalizeJSON(
			data: DefinedTable,
			turn_arrays_into_maps: boolean = false,
			exact_values: boolean = false,
		): RecursiveTable {
			function GetNontableValueTypeName(value: defined) {
				return exact_values ? tostring(value) : typeOf(value);
			}

			const is_array = turn_arrays_into_maps ? false : IsArray(data);
			if (is_array) {
				const data_types = new Array<string | RecursiveTable>();
				for (const value of data as DefinedArray) {
					const type_name = GetNontableValueTypeName(value);
					let type_data: string | RecursiveTable = type_name;
					if (typeIs(value, "table")) {
						const recursive_table = AnalizeJSON(value as DefinedTable, turn_arrays_into_maps, exact_values);
						const origin_table = FindFirstTable<RecursiveTable>(data_types);
						//if didnt find the table in the list of types, will push current
						if (origin_table === undefined) {
							type_data = recursive_table;
						} else {
							//otherwise will append missing keys from current to origin
							AddToRecursiveTable(origin_table, recursive_table);
							continue;
						}
					} else {
						if (data_types.includes(type_name)) continue;
					}
					data_types.push(type_data);
				}
				return new Map([["number", [data_types, false]]]);
			}

			const data_types: RecursiveTable = new Map();
			for (const [key, value] of data as Map<string, defined>) {
				let tuple = data_types.get(key);
				if (tuple === undefined) {
					if (typeIs(value, "table")) {
						//analizes the value as defined table and adds to the table
						tuple = [[AnalizeJSON(value as DefinedTable, turn_arrays_into_maps, exact_values)], false];
					} else {
						//adds the value to the tuple
						tuple = [[GetNontableValueTypeName(value)], false];
					}
					//add tuple to the table
					data_types.set(key, tuple);
					continue;
				}

				//0 - types
				const types = tuple[0];
				if (typeIs(value, "table")) {
					const type_name = AnalizeJSON(value as DefinedTable, turn_arrays_into_maps, exact_values);
					const origin_table = FindFirstTable<RecursiveTable>(types);
					if (origin_table === undefined) {
						//if didnt find the table, will add this
						types.push(type_name);
					} else {
						//if found, will append the recursive table
						AddToRecursiveTable(origin_table, type_name);
					}
					continue;
				}

				const type_name = GetNontableValueTypeName(value);
				if (types.includes(type_name)) continue;
				//if didnt find the type name, add to the table
				types.push(type_name);
			}

			return data_types;
		}

		type RecursiveMap = Map<string, (string | RecursiveMap)[]>;
		function ConvertRecursiveTableToRecursiveMap(recursive_table: RecursiveTable) {
			const recursive_map: RecursiveMap = new Map();
			for (const [key, [types, optional]] of recursive_table) {
				const types_list = [];
				for (const type_name of types) {
					if (typeIs(type_name, "table")) {
						//if is a table, convert to map and push
						types_list.push(ConvertRecursiveTableToRecursiveMap(type_name as RecursiveTable));
						continue;
					}
					types_list.push(type_name);
				}
				//set the value to the key, key is with the question mark if optional
				recursive_map.set(optional ? key + "?" : key, types_list);
			}

			return recursive_map;
		}

		export function AnalizeAndReturnJson(...args: Parameters<typeof AnalizeJSON>) {
			const recursive_table = AnalizeJSON(...args);
			const recursive_map = ConvertRecursiveTableToRecursiveMap(recursive_table);
			return recursive_map;
		}

		export function AnalizeAndPrintJson(...args: Parameters<typeof AnalizeAndReturnJson>) {
			print(AnalizeAndReturnJson(...args));
		}
	}

	export function GetDifferentKeys(map_1: Map<string, defined>, map_2: Map<string, defined>) {
		const keys = new Map<string, boolean>();
		for (const [key] of map_1) {
			if (map_2.has(key)) continue;
			//adds the key
			keys.set(key, true);
		}
		for (const [key] of map_2) {
			if (map_1.has(key)) continue;
			keys.set(key, true);
		}

		const array = new Array<string>();
		for (const [key] of keys) {
			array.push(key);
		}

		return array;
	}

	export namespace Instances {
		type RecursiveInstanceMap = Map<Instance, (Instance | RecursiveInstanceMap)[]>;
		export function GetInstanceTree(instance: Instance): RecursiveInstanceMap {
			const instances_list: (Instance | RecursiveInstanceMap)[] = [];
			const recursive_instance_map: RecursiveInstanceMap = new Map([[instance, instances_list]]);

			for (const child of instance.GetChildren()) {
				if (child.GetChildren().size() !== 0) {
					instances_list.push(GetInstanceTree(child));
					continue;
				}
				instances_list.push(child);
			}

			return recursive_instance_map;
		}

		type RecursiveStringMap = Map<string, (string | RecursiveStringMap)[]>;
		export function GetInstanceStringTree(
			instance: Instance,
			use_full_name: boolean = false,
			use_class_name: boolean = false,
		) {
			function GetInstanceString(instance: Instance) {
				if (use_class_name) return instance.ClassName;
				if (use_full_name) return instance.GetFullName();
				return instance.Name;
			}

			const instances_string_list: (string | RecursiveStringMap)[] = [];
			const recursive_instance_map: RecursiveStringMap = new Map([
				[GetInstanceString(instance), instances_string_list],
			]);

			for (const child of instance.GetChildren()) {
				if (child.GetChildren().size() !== 0) {
					//recursively takes the tables
					instances_string_list.push(GetInstanceStringTree(child, use_full_name, use_class_name));
					continue;
				}
				instances_string_list.push(GetInstanceString(child));
			}

			return recursive_instance_map;
		}

		export function AnalizeInstanceStringTreeAndReturn(
			turn_arrays_into_maps: boolean,
			exact_values: boolean,
			...args: Parameters<typeof GetInstanceStringTree>
		) {
			const instance_string_tree = GetInstanceStringTree(...args);
			//analizes instance string tree as json and returns
			return JSONAnalizer.AnalizeAndReturnJson(instance_string_tree, turn_arrays_into_maps, exact_values);
		}
	}

	export function FindFirstTable<T>(array: Array<defined>): T | undefined {
		return array.find((value) => typeIs(value, "table")) as T;
	}

	export function IsArray(data: DefinedTable) {
		return (data as DefinedMap).size() === (data as DefinedArray).size();
	}
	//prints the value and returns it;
	export function PrintAndReturn<T>(value: T): T {
		print(value);
		return value;
	}

	export function PrintMap(map: DefinedMap, scope: number = 0, exceptions: Array<DefinedMap> = []) {
		const brackets_space = "\t".rep(scope);
		//prints { if scope is 0
		if (scope === 0) print(`${brackets_space}{`);

		/**spacing for the elements, they have deeper scope */
		const scope_space = "\t".rep(++scope);
		//checks if it's already printed the table

		//clones itself to avoid cycle refference if other element contains the same map
		exceptions = table.clone(exceptions);
		//adds itself to exeptions
		exceptions.push(map);

		for (const [key, value] of map) {
			let text = "";
			//spacing from the start

			//prints full name of an instance
			if (typeIs(value, "Instance")) {
				text = value.GetFullName();
			} else if (typeIs(value, "table")) {
				//if contains the same table, it's not going to print it
				if (exceptions.includes(value as Map<any, any>)) text = "Cycle refference detected";
				//prints the other table with higher scope and exceptions
				else {
					//prints the opening of the table
					//quick fix because it didnt display the key if the table was printed
					print(`${scope_space}[${key}] = {`);
					//prints the table with current scope
					PrintMap(value as Map<any, any>, scope, exceptions);
					//skip the element
					continue;
				}
			} else if (typeIs(value, "string")) {
				//surrounds value in "
				text = `"${value}"`;
			} else text = tostring(value);
			print(`${scope_space}[${key}] = ${text}`);
		}
		print(`${brackets_space}}`);
	}

	export function TransformType<T>(value: unknown) {
		return value as T;
	}
}
