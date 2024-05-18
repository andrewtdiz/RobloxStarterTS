//!native
//!optimize 2
export namespace ColorTools {
	const floor = math.floor;
	export function PackColor(r: number, g: number, b: number, a: number) {
		return (r * 255) | ((g * 255) << 8) | ((b * 255) << 16) | ((a * 255) << 24);
	}

	export function PackColor3(color: Color3) {
		return PackColor(color.R, color.G, color.B, 1);
	}

	export function UnpackColor3(packed_color: number) {
		const [r, g, b, a] = UnpackColor(packed_color);
		return new Color3(r, g, b);
	}

	export function UnpackColor(packed_color: number) {
		const r = (packed_color & 0xff) / 255;
		const g = ((packed_color & 0xff00) >>> 8) / 255;
		const b = ((packed_color & 0xff0000) >>> 16) / 255;
		const a = ((packed_color & 0xff000000) >>> 24) / 255;
		return $tuple(r, g, b, a);
	}

	const min = math.min;
	const max = math.max;
	const pow = math.pow;
	const sqrt = math.sqrt;
	const atan2 = math.atan2;

	/**@link https://medium.muz.li/the-science-of-color-contrast-an-expert-designers-guide-33e84c41d156 */
	function ConvertValueToLinearColorSpace(value: number) {
		if (value <= 0.03928) return value / 12.92;
		return pow((value + 0.055) / 1.055, 2.4);
	}
	function ConvertToLinearColorSpace(color: Color3) {
		const r = ConvertValueToLinearColorSpace(color.R);
		const g = ConvertValueToLinearColorSpace(color.G);
		const b = ConvertValueToLinearColorSpace(color.B);
		return $tuple(r, g, b);
	}
	function GetRelativeLumunance(color: Color3) {
		const [r, g, b] = ConvertToLinearColorSpace(color);
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}

	export function CalculateContrastRatio(color_1: Color3, color_2: Color3) {
		const luminance_1 = GetRelativeLumunance(color_1);
		const luminance_2 = GetRelativeLumunance(color_2);

		const max_luminance = max(luminance_1, luminance_2);
		const min_luminance = min(luminance_1, luminance_2);

		return (max_luminance + 0.05) / (min_luminance + 0.05);
	}

	const black = new Color3(0, 0, 0);
	const white = new Color3(1, 1, 1);

	export function GetSimpleContrastColor(color: Color3) {
		const luminance = GetRelativeLumunance(color);

		if (luminance <= 0.5) return white;
		return black;
	}

	export function GetContrastColor(color: Color3) {
		const [r, g, b] = ConvertToLinearColorSpace(color);
		const luminance = GetRelativeLumunance(color);

		const saturation = (max(r, g, b) - min(r, g, b)) / max(r, g, b);
		const alpha = 0.5 * (2 * r - g - b);
		const beta = sqrt(3) * 0.5 * (g - b);
		const hue = atan2(beta, alpha);
		return Color3.fromHSV(hue, saturation, luminance);
	}
}
