//!native
//!optimize 2
export namespace Vector3Tools {
	const clamp = math.clamp;
	const min = math.min;

	//clamps the vector between the numbers;
	export function Clamp(vector: Vector3, min: number, max: number) {
		return new Vector3(clamp(vector.X, min, max), clamp(vector.Y, min, max), clamp(vector.Z, min, max));
	}

	export function LerpWithMagnitude(start_vector: Vector3, target_vector: Vector3, step: number) {
		const difference = target_vector.sub(start_vector);
		//if difference is 0 return the target;
		if (difference.Magnitude === 0) return target_vector;
		step = min(difference.Magnitude, step);
		//add difference with magnitude of step;
		return start_vector.add(difference.Unit.mul(step));
	}

	export function ClampMagnitude(vector: Vector3, min: number, max: number) {
		if (vector.Magnitude > max || vector.Magnitude < min) {
			//sets the magnitude to clamped value;
			vector = vector.Unit.mul(clamp(vector.Magnitude, min, max));
		}

		return vector;
	}
}
