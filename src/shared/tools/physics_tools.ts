//!--native
//!--optimize 2
import { Workspace } from "@rbxts/services";

export namespace PhysicsTools {
	/**calculates the vertical velocity for parabolic trajectory with horizontal speed
	 * @param horizontal_speed horizontal speed
	 * @param offset distance from launcher to target; (target.Position - launcher.Position);
	 */
	export function CalculateTrajectoryVerticalVelocity(horizontal_speed: number, offset: Vector3) {
		const horizontal_offset = offset.mul(new Vector3(1, 0, 1));
		const horizontal_distance = horizontal_offset.Magnitude;
		//should be negative or positive
		const vertical_distance = offset.Y;
		const vertical_speed =
			(vertical_distance * horizontal_speed +
				((Workspace.Gravity / 2) * horizontal_distance * horizontal_distance) / horizontal_speed) /
			horizontal_distance;
		return vertical_speed;
	}

	/**
	 *
	 * @param target
	 * @param start
	 * @param finish
	 * @returns [t, position, is_on_the_line]
	 */
	export function GetClosestPositionOnLine(
		target: Vector3,
		start: Vector3,
		finish: Vector3,
	): LuaTuple<[number, Vector3, boolean]> {
		const line_offset = finish.sub(start);
		const offset = target.sub(start);

		const t = offset.Dot(line_offset) / line_offset.Dot(line_offset);
		const position_of_line_offset = line_offset.mul(t);

		const position_on_line = start.add(position_of_line_offset);
		return $tuple(t, position_on_line, t >= 0 && t <= 1);
	}
}
