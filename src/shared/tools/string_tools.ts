//!native
export namespace StringTools {
	const random = new Random();
	const min = math.min;
	const round = math.round;

	//to convers characters into array of characters
	const characters = string.split("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", "");
	const max_itteractions = 100;
	/**generates a unique string id with requested length */
	export function GenerateStringId(length: number, exceptions: Array<string>) {
		let id = "";
		let itteration = 0;
		do {
			//prevents from breaking the code;
			itteration++;
			if (itteration > max_itteractions) {
				warn("Exeded amount of itterations");
				break;
			}

			//resets the id
			id = "";
			for (const i of $range(1, length)) {
				//takes the random character and appends it
				const random_character_index = random.NextInteger(0, characters.size() - 1);
				id += characters[random_character_index];
			}
			//recreates id if it exists in exceptions;
		} while (exceptions.includes(id));
		return id;
	}

	/**lerps text with alpha */
	export function LerpText(text: string, alpha: number) {
		//lerps the amount of characters
		const amount_of_characters = text.size();
		const lerped_text_size = min(round(amount_of_characters * alpha), amount_of_characters);
		return text.sub(1, lerped_text_size);
	}

	export function Difference() {}
}
