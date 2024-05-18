const pi = math.pi;
const max = math.max;
/**
 * used for the animations
 * https://www.youtube.com/watch?v=KPoeNZZ6H4s&ab_channel=t3ssel8r
 */

export class SecondOrderDynamics {
	//---previous input
	private xp_: Vector3;

	//---state variables
	private y_: Vector3;
	private yd_: Vector3;

	//---dynamics constants
	private k1_: number;
	private k2_: number;
	private k3_: number;
	/**
	 *
	 * @param f frequency
	 * @param z damping 0 - 1 - upderdamped; 1 - critical damping; >1 - will not vibrate
	 * @param r initial responce >1 overshoot the target; <0 will anticipate the motion; mechanical motion = 2;
	 * @param x0 start position
	 */
	constructor(f: number, z: number, r: number, x0: Vector3) {
		//compute constants
		this.k1_ = z / (pi * f);
		this.k2_ = 1 / (2 * pi * f * (2 * pi * f));
		this.k3_ = (r * z) / (2 * pi * f);

		// initialize variables
		this.xp_ = x0;
		this.y_ = x0;
		this.yd_ = Vector3.zero;
	}

	/**
	 * computes the new position
	 * @param delta_time time passed
	 * @param x current input
	 * @param xd velocity of change
	 * @returns new position
	 */
	Update(delta_time: number, x: Vector3, xd?: Vector3) {
		if (xd === undefined) {
			//estimate velocity
			xd = x.sub(this.xp_).div(delta_time);
		}
		//clams k2 to guarantee stability
		const k2_stable = max(
			this.k2_,
			(delta_time * delta_time) / 2 + (delta_time * this.k1_) / 2,
			delta_time * this.k1_,
		);
		// integrate position by velocity
		this.y_ = this.y_.add(this.yd_.mul(delta_time));
		//integrate velocity by acceleration
		this.yd_ = this.yd_.add(
			x
				.add(xd.mul(this.k3_))
				.sub(this.y_)
				.sub(this.yd_.mul(this.k1_))
				.mul(delta_time / k2_stable),
		);

		return this.y_;
	}
}

export class SecondOrderDynamicsNumber {
	//---previous input
	private xp_: number;

	//---state variables
	private y_: number;
	private yd_: number;

	//---dynamics constants
	private k1_: number;
	private k2_: number;
	private k3_: number;
	/**
	 *
	 * @param f frequency
	 * @param z damping 0 - 1 - upderdamped; >1 - will not vibrate
	 * @param r initial responce >1 overshoot the target; <0 will anticipate the motion; mechanical motion = 2;
	 * @param x0 start position
	 */
	constructor(f: number, z: number, r: number, x0: number) {
		//compute constants
		this.k1_ = z / (pi * f);
		this.k2_ = 1 / (2 * pi * f * (2 * pi * f));
		this.k3_ = (r * z) / (2 * pi * f);

		// initialize variables
		this.xp_ = x0;
		this.y_ = x0;
		this.yd_ = 0;
	}

	/**
	 * computes the new position
	 * @param delta_time time passed
	 * @param x current input
	 * @param xd velocity of change
	 * @returns new position
	 */
	Update(delta_time: number, x: number, xd?: number) {
		if (xd === undefined) {
			//estimate velocity
			xd = (x - this.xp_) / delta_time;
		}
		//clams k2 to guarantee stability
		const k2_stable = max(
			this.k2_,
			(delta_time * delta_time) / 2 + (delta_time * this.k1_) / 2,
			delta_time * this.k1_,
		);
		// integrate position by velocity
		this.y_ = this.y_ + this.yd_ * delta_time;
		//integrate velocity by acceleration
		this.yd_ = this.yd_ + (delta_time * (x + this.k3_ * xd - this.y_ - this.k1_ * this.yd_)) / k2_stable;

		return this.y_;
	}
}
