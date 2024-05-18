import { HttpService } from "@rbxts/services";

export namespace HttpTools {
	//removes lines with comments from the code
	//with them, cannot decode
	export function RemoveJSONComments(json_code_text: string) {
		const lines = json_code_text.split("\n");
		const filtered_lines = lines.filter((value) => {
			//filters the // comments
			//allow if amount of comments on line is 0;
			return value.match("//").size() === 0;
		});
		//joines with the space;
		return filtered_lines.join(" ");
	}

	//returns decoded data from HttpSerivce
	type Attempt<ReturnType = unknown> = LuaTuple<[boolean, ReturnType?]>;
	export function FetchJSONFromLink<ReturnType>(
		link: string,
		remove_comments: boolean = true,
		warn_on_error: boolean = false,
	): Attempt<ReturnType> {
		let success = true;
		let result = undefined;
		try {
			const raw_data = HttpService.GetAsync(link);
			//removes commands if remove_comments is true
			result = HttpService.JSONDecode(remove_comments ? RemoveJSONComments(raw_data) : raw_data);
		} catch (error) {
			success = false;
			if (warn_on_error) warn(error);
		}

		return $tuple(success, success ? (result as ReturnType) : undefined);
	}
}
