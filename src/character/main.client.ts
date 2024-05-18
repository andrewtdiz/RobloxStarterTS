import { ArrayTools } from "shared/tools/array_tools";
import { CameraStack } from "shared/tools/namespaces/camera_stack";

const camera = new Instance("Camera");
const character = script.Parent as Model;
camera.CameraType = Enum.CameraType.Custom;

CameraStack.PushToStack(camera);

interface CameraProperties {
	FOV: number;
}

const cameraProperties: CameraProperties[] = [
	{
		FOV: 60,
	},
	{
		FOV: 60,
	},
	{
		FOV: 60,
	},
];

while (true) {
	const rand = ArrayTools.GetRandomElement(cameraProperties);
	camera.FieldOfView = rand.FOV;
	task.wait(3);
}
