//!native
//!optimize 2
export namespace MathTools {
	const clamp = math.clamp;
	const max = math.max;
	const min = math.min;
	const sign = math.sign;
	const abs = math.abs;
	const ceil = math.ceil;
	const floor = math.floor;
	const pow = math.pow;
	const pi = math.pi;
	const tau = 2 * math.pi;
	export function Lerp(start: number, target: number, alpha: number) {
		alpha = clamp(alpha, 0, 1);
		return start + (target - start) * alpha;
	}
	//2 - 10 2 = 4
	//8 - 10 4 = 10
	//10 - 8 4 = 8
	export function LerpWith(start: number, target: number, step: number) {
		const difference = target - start;
		//calculating min difference towards target;
		step = sign(difference) * min(step, abs(difference));
		return start + step;
	}
	//sets angle in range [-pi, pi]
	export function NormalizeAngle(alpha: number) {
		//if bigger than pi, substracts tau * sign(angle);
		//if less than pi, adds tau;
		return abs(alpha) < pi ? alpha : -sign(alpha) * tau + alpha;
	}

	//lerpes the angle with fixed step
	//angle [-pi, pi]
	export function LerpAngleWith(start: number, target: number, step: number) {
		if (start === target) return target;
		let angle = target - start;
		//calculates the smallest angle
		//if bigger or equals to pi, subtracts tau;
		//if less or equals to -pi adds tau;
		angle += abs(angle) >= pi ? tau * -sign(angle) : 0;

		//calculates minimal step to not overwalk the angle
		step = min(step, abs(angle));
		//step * sign(angle) -- steps in direction of the target angle
		const new_angle = start + step * sign(angle);
		//returns normalized angle
		return NormalizeAngle(new_angle);
	}

	//maps the value from 1 range to other
	export function Map(
		value: number,
		input_min: number,
		input_max: number,
		output_min: number,
		output_max: number,
		clamp?: boolean,
	) {
		const difference_input = input_max - input_min;
		const difference_output = output_max - output_min;
		const multiplier = difference_output / difference_input;

		const current_difference = value - input_min;
		let output = output_min + current_difference * multiplier;
		if (clamp) {
			const min_output = min(output_min, output_max);
			const max_output = max(output_min, output_max);
			//can be error if use clamp
			output = max(output, min_output);
			output = min(output, max_output);
		}
		return output;
	}

	//wraps number in range
	//2, 2, 0, 2 => 2
	//0, 4, 0, 3 => 1
	//0 + 4 = 4 - (3 - 0) => 1
	export function WrapAdd(value: number, step: number, min_value: number, max_value: number) {
		let offset_to_min_value = value + step - min_value;

		const range = max_value - min_value;
		//prevent cases with min and max values 0;
		if (range === 0) return min_value;

		//turns -1 to 0 without abs
		const range_ratio = ceil(abs(offset_to_min_value / range));
		if (offset_to_min_value > range) {
			//it should be in range of a range, or will subtract 2 ranges
			offset_to_min_value -= range * (range_ratio - 1);
		} else if (offset_to_min_value < 0) {
			offset_to_min_value += range * range_ratio;
		}
		return min_value + offset_to_min_value;
	}

	// export function WrapPage(page_number: number, min_page: number, max_page: number) {

	// }

	//unit number [0, 1]
	//bias [-inf, 1];
	//bias -1 -larger numbers are very frequent
	//bias 1 -smaller numbers are very frequent
	//bias power of the curve
	//gets bigger numbers that are less frequent
	//https://www.youtube.com/watch?v=lctXaT9pxA0&t=454s
	export function BiasFunction(unit_number: number, bias: number) {
		//pow works better than ^
		const k = pow(1 - bias, 3);
		return (unit_number * k) / (unit_number * k - unit_number + 1);
	}

	export function GetValueFromNumberSequence(number_sequence: NumberSequence, alpha: number) {
		const keypoints = number_sequence.Keypoints;
		//return first if alpha is 0
		if (alpha === 0) return keypoints[0].Value;
		//return last if alpha is 1
		if (alpha === 1) return keypoints[keypoints.size() - 1];

		let current_keypoint;
		let next_keypoint;
		let value = 0;
		for (const _ of $range(0, keypoints.size() - 2)) {
			current_keypoint = keypoints[0];
			next_keypoint = keypoints[1];
			if (!(alpha >= current_keypoint.Time && alpha <= next_keypoint.Time)) continue;

			/**time from the current keypoint */
			const offset = alpha - current_keypoint.Time;
			/**time range between the keypoints */
			const time_range = next_keypoint.Time - current_keypoint.Time;
			/**value range between the keypoints */
			const value_range = next_keypoint.Value - current_keypoint.Value;
			/**calculates the value, remaps offset from keypoint from time range to value range */
			value = (offset / time_range) * value_range;
			break;
		}

		return value;
	}
}
