//!native
//!optimize 2
export namespace DetectingTools {
	const abs = math.abs;
	const max = math.max;
	const min = math.min;
	const random = new Random();
	//dont change the direction!
	const corners = table.freeze([
		new Vector3(1, 1, 1),
		new Vector3(1, 1, -1),
		new Vector3(-1, 1, 1),
		new Vector3(-1, 1, -1),
		new Vector3(1, -1, 1),
		new Vector3(1, -1, -1),
		new Vector3(-1, -1, 1),
		new Vector3(-1, -1, -1),
	]);

	const vector_xy = new Vector3(1, 1, 0);

	/**@returns corners in global space */
	function GetCorners(part: BasePart, local_space?: boolean) {
		const part_corners = new Array<Vector3>(8);
		//takes the position of the part and applies the corners from the center;
		const half_size = part.Size.mul(0.5);
		for (const corner of corners) {
			const part_corner = corner.mul(half_size);
			part_corners.push(local_space ? part_corner : part.CFrame.mul(part_corner));
		}

		return part_corners;
	}

	function SamplePoints(part: BasePart, amount: number, local_space?: boolean) {
		const points = new Array<Vector3>(max(amount, 0));
		const half_size = part.Size.mul(0.5);
		for (const i of $range(0, amount)) {
			const point = random.NextUnitVector().mul(half_size);
			points[i] = local_space ? point : part.CFrame.mul(point);
		}

		return points;
	}

	function PointsToViewPortPosition(camera: Camera, points: Vector3[]) {
		const view_port_points = new Array<LuaTuple<[Vector3, boolean]>>(8);
		for (const point of points) {
			const view_port_point_tuple = camera.WorldToViewportPoint(point);

			view_port_points.push(view_port_point_tuple);
		}

		return view_port_points;
	}

	function PointsLocalSpace(cframe: CFrame, world_points: Array<Vector3>) {
		const local_points = new Array<Vector3>(8);
		for (const point of world_points) {
			local_points.push(cframe.PointToObjectSpace(point));
		}

		return local_points;
	}
	export function IsPartInside(zone: BasePart, part: BasePart, fully_inside: boolean = true) {
		const zone_half_size = zone.Size.mul(0.5);
		//takes the corners of the part
		const part_corners = GetCorners(part);

		//converts points of the part to the local space of the zone;
		const converted_part_corners = PointsLocalSpace(zone.CFrame, part_corners);

		let is_fully_inside = true;
		for (const converted_corner of converted_part_corners) {
			const is_in_x = abs(converted_corner.X) <= zone_half_size.X;
			const is_in_y = abs(converted_corner.Y) <= zone_half_size.Y;
			const is_in_z = abs(converted_corner.Z) <= zone_half_size.Z;
			const is_inside = is_in_x && is_in_y && is_in_z;

			if (!fully_inside && is_inside) return true;

			//if fully inside makes other calculation
			is_fully_inside = is_fully_inside && is_inside;
		}

		return is_fully_inside;
	}

	function GetVerticesInterval(vertices: Vector3[], axis: Vector3) {
		let result_x = axis.Dot(vertices[0]);
		let result_y = result_x;

		for (const vertex of vertices) {
			const projection = axis.Dot(vertex);
			if (projection < result_x) {
				result_x = projection;
			}
			if (projection > result_y) {
				result_y = projection;
			}
		}
		return $tuple(result_x, result_y);
	}

	function OverlapOnAxis(vertices_0: Vector3[], vertices_1: Vector3[], axis: Vector3) {
		const [x_1, y_1] = GetVerticesInterval(vertices_0, axis);
		const [x_2, y_2] = GetVerticesInterval(vertices_1, axis);
		return x_2 <= y_1 && x_1 <= y_2;
	}

	export function IsPointInside(zone: BasePart, point: Vector3) {
		const offset = zone.CFrame.PointToObjectSpace(point);
		const half_size = zone.Size.mul(0.5);
		const is_in_x = abs(offset.X) <= half_size.X;
		const is_in_y = abs(offset.Y) <= half_size.Y;
		const is_in_z = abs(offset.Z) <= half_size.Z;
		return is_in_x && is_in_y && is_in_z;
	}

	function GetFilteredPointsFromScreenPoints(screen_points: [Vector3, boolean][]) {
		const edges: readonly (readonly [Vector3, Vector3])[] = [
			[screen_points[0][0], screen_points[2][0]],
			[screen_points[0][0], screen_points[1][0]],
			[screen_points[1][0], screen_points[3][0]],
			[screen_points[2][0], screen_points[3][0]],
			[screen_points[0][0], screen_points[4][0]],
			[screen_points[1][0], screen_points[5][0]],
			[screen_points[2][0], screen_points[6][0]],
			[screen_points[3][0], screen_points[7][0]],
			[screen_points[4][0], screen_points[6][0]],
			[screen_points[4][0], screen_points[5][0]],
			[screen_points[5][0], screen_points[7][0]],
			[screen_points[6][0], screen_points[7][0]],
		];

		const filtered_points = new Array<Vector3>(24);
		for (const i of $range(0, edges.size() - 1)) {
			const [point_0, point_1] = edges[i];
			if (point_0.Z < 0 && point_1.Z < 0) continue;
			const distance = max(point_0.Z, point_1.Z) - min(point_0.Z, point_1.Z);
			let converted_point_0 = new Vector3(point_0.X, point_0.Y, 0);
			let converted_point_1 = new Vector3(point_1.X, point_1.Y, 0);
			if (point_0.Z < 0) {
				//0 - point.Z;
				const distance_to_plane = -point_0.Z;
				const t = distance_to_plane / distance;
				converted_point_0 = converted_point_0.Lerp(converted_point_1, t);
			}

			if (point_1.Z < 0) {
				const distance_to_plane = -point_1.Z;
				const t = distance_to_plane / distance;
				converted_point_1 = converted_point_1.Lerp(converted_point_0, t);
			}

			filtered_points.push(converted_point_0);
			filtered_points.push(converted_point_1);
		}

		return filtered_points;
	}

	export function IsOnTheScreen(
		camera: Camera,
		part: BasePart,
		fully_inside: boolean = false,
		samples_amount: number = -1,
	) {
		if (!fully_inside) {
			if (IsPointInside(part, camera.CFrame.Position)) {
				return true;
			}
		}

		const part_corners = GetCorners(part);
		const sampled_points = SamplePoints(part, samples_amount);
		const screen_points = PointsToViewPortPosition(camera, [...part_corners, ...sampled_points]);

		let is_fully_inside = true;
		for (const [_, on_the_screen] of screen_points) {
			if (!fully_inside && on_the_screen) {
				return true;
			}

			is_fully_inside = is_fully_inside && on_the_screen;
		}

		if (fully_inside && is_fully_inside) {
			return true;
		}

		//TODO;
		// const view_port_points = [Vector3.zero, new Vector3(camera.ViewportSize.X, 0), new Vector3(0, camera.ViewportSize.Y), new Vector3(camera.ViewportSize.X, camera.ViewportSize.Y)];
		// const filtered_points = GetFilteredPointsFromScreenPoints(screen_points);
		// //none on the screen
		// if (filtered_points.size() === 0) return false;

		// const on_x = OverlapOnAxis(view_port_points, filtered_points, Vector3.yAxis);
		// const on_y = OverlapOnAxis(view_port_points, filtered_points, Vector3.xAxis);

		// return on_x && on_y;
		return false;
	}
	/**
   // const corners = [
      // new Vector3(1, 1, 1), --0
      // new Vector3(-1, 1, 1), --2
  
      // new Vector3(1, 1, 1), --0
      // new Vector3(1, 1, -1), --1
  
      // new Vector3(1, 1, -1), --1
      // new Vector3(-1, 1, -1), --3
  
      // new Vector3(-1, 1, 1), --2
      // new Vector3(-1, 1, -1), --3
      
      // new Vector3(1, 1, 1), --0
      // new Vector3(1, -1, 1), --4
  
      // new Vector3(1, 1, -1), --1
      // new Vector3(1, -1, -1), --5
  
      // new Vector3(-1, 1, 1), --2
      // new Vector3(-1, -1, 1), --6
  
      // new Vector3(-1, 1, -1), --3
      // new Vector3(-1, -1, -1), --7
  
      // new Vector3(1, -1, 1), --4
      // new Vector3(-1, -1, 1), --6
  
      // new Vector3(1, -1, 1), --4
      // new Vector3(1, -1, -1), --5
  
      // new Vector3(1, -1, -1), --5
      // new Vector3(-1, -1, -1), --7
  
    //   new Vector3(-1, -1, 1), --6
    //   new Vector3(-1, -1, -1), --7
    // ];
   */
}
