const random = new Random();
const noise = math.noise;
export class CameraShake {
	private offset_: Vector3 = random.NextUnitVector().mul(5000);
	frequency_: number;
	amplitude_: number;
	constructor(frequency: number, amplitude: number) {
		this.frequency_ = frequency;
		this.amplitude_ = amplitude;
	}

	Update(delta_time: number) {
		this.offset_ = this.offset_.add(Vector3.one.mul(this.frequency_ * delta_time));
		return $tuple(
			noise(this.offset_.X) * this.amplitude_,
			noise(this.offset_.Y) * this.amplitude_,
			noise(this.offset_.Z) * this.amplitude_,
		);
	}
}
