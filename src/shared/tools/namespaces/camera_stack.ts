import { Workspace } from "@rbxts/services";
import { ArrayTools } from "shared/tools/array_tools";
import { FunctionTools } from "shared/tools/function_tools";

export namespace CameraStack {
	let cashed_camera: Camera;
	function InitializeClient() {
		const camera_folder = new Instance("Folder", Workspace);
		cashed_camera = Workspace.CurrentCamera!;
		cashed_camera.Parent = camera_folder;
		//will be always underneath
		PushToStack(cashed_camera, -100);
	}

	interface IStackElement {
		camera: Camera;
		priority: number;
		//destroy connection
		connection: RBXScriptConnection;
	}

	const stack: IStackElement[] = [];
	function SetFirstCameraFromStack() {
		Workspace.CurrentCamera = stack[0].camera;
	}

	/**flag to prevent infinite camera change */
	let changing = false;
	Workspace.GetPropertyChangedSignal("CurrentCamera").Connect(() => {
		if (changing) return;
		changing = true;
		//resets the camera if it gets changed
		SetFirstCameraFromStack();
		changing = false;
	});

	export function RemoveFromStack(camera: Camera) {
		//removes the camera from stack and sets the last one
		const [removed_element] = ArrayTools.RemoveFromArray(stack, (element) => element.camera === camera);
		if (removed_element === undefined) return;
		removed_element.connection.Disconnect();
		table.clear(removed_element);

		//sets the last camera
		SetFirstCameraFromStack();
	}

	export function PushToStack(camera: Camera, priority: number = 0) {
		//removes from the list if it gets destroyed
		const connection = camera.Destroying.Once(() => RemoveFromStack(camera));
		RemoveFromStack(camera);
		ArrayTools.SortedInsert(
			stack,
			{
				camera,
				priority,
				connection,
				//insers at the start
			},
			(a, b) => {
				return a.priority >= b.priority;
			},
		);

		SetFirstCameraFromStack();
	}

	FunctionTools.ExecuteIfClient(InitializeClient);
}
