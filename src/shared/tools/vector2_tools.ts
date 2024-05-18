//!native
//!optimize 2
export namespace Vector2Tools {
	const sin = math.sin;
	const cos = math.cos;
	const min = math.min;
	const max = math.max;
	const clamp = math.clamp;
	export function Rotate(vector: Vector2, angle: number) {
		const angle_sin = sin(angle);
		const angle_cos = cos(angle);
		return new Vector2(vector.X * angle_cos - vector.Y * angle_sin, vector.X * angle_sin + vector.Y * angle_cos);
	}
	export function LerpWithMagnitude(start_vector: Vector2, target_vector: Vector2, step: number) {
		const difference = target_vector.sub(start_vector);
		//if difference is 0 return the target;
		if (difference.Magnitude === 0) return target_vector;
		step = min(difference.Magnitude, step);
		//add difference with magnitude of step;
		return start_vector.add(difference.Unit.mul(step));
	}

	export function Clamp(vector: Vector2, min: number, max: number) {
		return new Vector2(clamp(vector.X, min, max), clamp(vector.Y, min, max));
	}

	export function ClampWithVector(vector: Vector2, min_vector: Vector2, max_vector: Vector2) {
		return new Vector2(clamp(vector.X, min_vector.X, max_vector.X), clamp(vector.Y, min_vector.Y, max_vector.Y));
	}

	export function SubtractMagnitude(vector: Vector2, amount: number, clamp_to_zero: boolean = false) {
		let new_magnitude = vector.Magnitude - amount;
		//if less then 0, clamps;
		if (clamp_to_zero) new_magnitude = max(new_magnitude, 0);
		//sets new magnitude;
		return vector.Unit.mul(new_magnitude);
	}
}
