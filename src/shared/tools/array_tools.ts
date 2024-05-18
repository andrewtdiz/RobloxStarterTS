//!native
//!optimize 2
export namespace ArrayTools {
	const random = new Random();
	export function Shuffle<T extends defined>(array: readonly T[]) {
		const array_size = array.size();
		const shuffled_array = new Array<T>(array_size);
		//goes backwards to avoid conflict with randomised numbers;
		//takes the random index and swaps with the current
		for (const i of $range(array_size - 1, 0, -1)) {
			const random_index = random.NextInteger(0, i);
			const random_value = array[random_index];
			//if value in shuffled array exist, dont take from the existing array
			//can cause duplicats
			const current_value = shuffled_array[i] ?? array[i];

			//swaps the values current with random;
			shuffled_array[i] = random_value;
			shuffled_array[random_index] = current_value;
		}

		return shuffled_array;
	}

	/**removes the element from the array */
	export function RemoveElementFromArray<T extends defined>(array: T[], element: T) {
		return array.remove(array.indexOf(element));
	}

	/**removes all or 1 elements if they check function returns true */
	export function RemoveFromArray<T extends defined>(
		array: T[],
		check: (element: T) => boolean,
		stop_on_first: boolean = true,
	) {
		const indexes_to_remove = new Array<number>();
		for (const i of $range(0, array.size() - 1)) {
			const element = array[i];
			if (!check(element)) continue;
			indexes_to_remove.push(i);
			//stops if stop_on_first flag is true
			if (stop_on_first) break;
		}

		const removed_elements = new Array<T>(indexes_to_remove.size());
		//goest backwards to not mess the indexes
		for (const i of $range(indexes_to_remove.size() - 1, 0, -1)) {
			const index_to_remove = indexes_to_remove[i];
			removed_elements.push(array.remove(index_to_remove)!);
		}

		return removed_elements;
	}

	export function IncludesOneOf<T extends defined>(array: readonly T[], possible_elements: T[]) {
		for (const element of possible_elements) {
			if (array.includes(element)) return true;
		}
		return false;
	}

	/**@returns same elements in the arrays */
	export function GetIntersection<T extends defined>(array_0: readonly T[], array_1: readonly T[]) {
		const intersections = new Array<T>();
		//if the element is in both tables any table could be used
		for (const element of array_0) {
			if (array_1.includes(element)) intersections.push(element);
		}
		return intersections;
	}

	/**if insert_check returns true, element will be inserted at index of value that it's getting compared to
	 * @param a - inserted value
	 * @param b - other value
	 */
	export function SortedInsert<T extends defined>(
		array: T[],
		value: T,
		insert_check: (a: T, b: T, index: number, array: T[]) => boolean,
	) {
		for (const i of $range(0, array.size() - 1)) {
			if (!insert_check(value, array[i], i, array)) continue;
			array.insert(i, value);
			return;
		}
		array.push(value);
	}

	export function InsertElements<T extends defined>(
		array: Array<T>,
		elements: Array<T>,
		position: number = array.size(),
	) {
		for (const element of elements) {
			array.insert(position++, element);
		}
		return array;
	}

	export function JoinArrays<T extends defined>(array_1: readonly T[], array_2: readonly T[]) {
		const combined_array = new Array<T>();
		//push elements from 2 arrays;
		for (const element of array_1) combined_array.push(element);
		for (const element of array_2) combined_array.push(element);
		return combined_array;
	}

	export function GetRandomElement<T>(array: readonly T[]) {
		//returns array element with random index
		const random_index = random.NextInteger(0, array.size() - 1);
		return array[random_index];
	}

	export function WeightedPick<T>(array: Array<[number, T]>): T {
		let total_value = 0;
		for (const element of array) {
			const [weight, _] = element;
			total_value += weight;
		}
		let random_value = random.NextNumber() * total_value;
		for (const element of array) {
			const [weight, value] = element;
			if (random_value < weight) return value;
			random_value -= weight;
		}

		warn("array doent contain any items");

		//to set type
		return undefined as T;
	}

	/**filters the same value, if selector is undefined will use the element itself to compare */
	export function FilterSame<T extends defined>(array: Array<T>, selector?: <Q extends defined>(element: T) => Q) {
		const indexes_to_remove = new Array<number>();
		const found_values = new Array<defined>();
		for (const i of $range(0, array.size() - 1)) {
			const element = array[i];
			//uses selector to select the element or uses element itself
			const value = selector !== undefined ? selector(element) : element;
			if (found_values.includes(value)) {
				//adds to the indexes in order to remove
				indexes_to_remove.push(i);
				continue;
			}

			found_values.push(value);
		}

		//goes backwards to not mess up indexes
		for (const i of $range(indexes_to_remove.size() - 1, 0, -1)) {
			const index_to_remove = indexes_to_remove[i];
			array.remove(index_to_remove);
		}
		return array;
	}

	export function SubArray<T extends defined>(array: readonly T[], start: number, finish: number) {
		const subtracted_array = new Array<T>();
		array.move(start, finish, 0, subtracted_array);
		return subtracted_array;
	}

	export type WeigtedArray<T extends defined> = Array<[number, T]>;
}
