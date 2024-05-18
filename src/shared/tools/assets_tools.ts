import { ContentProvider } from "@rbxts/services";

export namespace AssetsTools {
	export async function TryPreload(
		assets: (string | Instance)[],
		callback?: (contentId: string, status: Enum.AssetFetchStatus) => void,
	) {
		ContentProvider.PreloadAsync(assets, callback);
	}
}
