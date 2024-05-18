import { HttpService, RunService, TweenService } from "@rbxts/services";
import { InstanceTools } from "shared/tools/instance_tools"
import { MathTools } from "shared/tools/math_tools";

type PossibleEasingStyle = "Linear" | "Sine" | "Back" | "Quad" | "Quart" | "Quint" | "Bounce" | "Elastic" | "Exponential" | "Circular" | "Cubic" | "Constant";
type PossibleEasingDirection = "In" | "Out" | "InOut";

interface ITimeLineKeyFrame<T> {
  frame: number,
  easing_style?: PossibleEasingStyle
  easing_direction?: PossibleEasingDirection
  value: T
}

interface IPropertyData<T> {
  name: string,
  timeline: ITimeLineKeyFrame<T>[],
  default: T
}

interface IMoonAnimationData {
  Information: {
    Length: number
  }
}

const min = math.min;
const fps = 60;
const WrapAdd = MathTools.WrapAdd;
const clamp = math.clamp;

function ConstructPropertyTimeLine<T>(property_folder: Folder, default_easing_style: PossibleEasingStyle = "Linear", default_easing_direction: PossibleEasingDirection = "In") {
  const data: IPropertyData<T> = {
    name: property_folder.Name,
    //maps the children and sorts them by frame
    timeline: property_folder.GetChildren().mapFiltered((keyframe) => {
      //skips the not folders
      if (!keyframe.IsA("Folder")) return;

      const frame = tonumber(keyframe.Name)!;
      const value = <ValueBase>InstanceTools.WaitForPath(keyframe, ["Values", "0"]);
      const easing_style = <PossibleEasingStyle | undefined>InstanceTools.FindFirstOnPath<StringValue>(keyframe, ["Eases", "0", "Type"])?.Value;
      const easing_direction = <PossibleEasingDirection | undefined>InstanceTools.FindFirstOnPath<StringValue>(keyframe, ["Eases", "0", "Params", "Direction"])?.Value;

      return {
        frame,
        value: value.Value as T,
        easing_style: easing_style ?? default_easing_style,
        easing_direction: easing_direction ?? default_easing_direction
      }
    }).sort((a, b) => a.frame < b.frame),

    default: (<ValueBase>property_folder.WaitForChild("default")).Value as T
  }

  if (data.timeline[0].frame !== 0) {
    data.timeline.insert(0, {
      frame: 0,
      value: data.default,
      easing_style: default_easing_style,
      easing_direction: default_easing_direction
    })
  }
  return data
}

class PropertyTimeline<T> {
  private property_data_: IPropertyData<T>;

  constructor(property_data_folder: Folder, default_easing_style?: PossibleEasingStyle, default_easing_direction?: PossibleEasingDirection) {
    this.property_data_ = ConstructPropertyTimeLine(property_data_folder, default_easing_style, default_easing_direction);
  }

  /**
   * @param frame frame index 0 - max frame
   * @returns previous_keyframe, new_keyframe, progress [0, 1)
   */
  Get(frame: number): LuaTuple<[ITimeLineKeyFrame<T>, ITimeLineKeyFrame<T>, number]> {
    let keyframe_0;
    let keyframe_1;
    const max_index = this.property_data_.timeline.size() - 1;
    for (const i of $range(max_index, 0, -1)) {
      keyframe_0 = this.property_data_.timeline[i];
      if (keyframe_0.frame > frame) continue;
      const next_index = min(max_index, i + 1);
      keyframe_1 = this.property_data_.timeline[next_index];
      break;
    }
    const offset = frame - keyframe_0!.frame;
    const difference = keyframe_1!.frame - keyframe_0!.frame;
    //prevent from dividing by 0
    const progress = difference !== 0 ? offset / difference : 0;
    return $tuple(keyframe_0!, keyframe_1!, progress);
  }
}

interface IAnimator {
  SetFrame(frame: number): void
}
interface IAnimation {
  SetFrame(frame: number): void
}

class CFrameAnimator implements IAnimator {
  private object_: { CFrame: CFrame };
  private cframe_timeline_: PropertyTimeline<CFrame>;
  constructor(object: { CFrame: CFrame }, property_data: Folder) {
    this.object_ = object;
    this.cframe_timeline_ = new PropertyTimeline<CFrame>(property_data);
  }

  SetFrame(frame: number) {
    const [cframe_0, cframe_1, t] = this.cframe_timeline_.Get(frame);
    //TODO: handle lerping with tween
    this.object_.CFrame = cframe_0.value.Lerp(cframe_1.value, t);
  }
}

class BasePartAnimation {
  private properties_animators_: IAnimator[] = []
  constructor(object: BasePart, object_data: Folder) {
    const cframe_property = <Folder | undefined>object_data.FindFirstChild("CFrame");
    if (cframe_property !== undefined) {
      const cframe_timeline = new CFrameAnimator(object, cframe_property);
      this.properties_animators_.push(cframe_timeline);
    }
  }

  SetFrame(frame: number) {
    for (const property_animator of this.properties_animators_) {
      property_animator.SetFrame(frame);
    }
  }
}

function GetLength(object_data: Folder) {
  let max_value = -1;
  //properties
  const children = object_data.GetChildren();
  children.forEach((property) => {
    property.GetChildren().forEach((child) => {
      const index = tonumber(child.Name);
      if (index === undefined) return;
      if (index > max_value) max_value = index;
    })
  })

  return max_value / fps;
}

export function GetMoonAnimationLength(animation_data: StringValue, exact: boolean = false) {
  if (exact) {
    const json = <IMoonAnimationData>HttpService.JSONDecode(animation_data.Value);
    return json.Information.Length;
  }

  let max_frame = -1;
  const objects = <Folder[]>animation_data.GetChildren();
  objects.forEach((child) => {
    const length = GetLength(child)
    if (length > max_frame) max_frame = length;
  })
  return max_frame;
}

export class MoonAnimation<T extends Instance> {
  readonly length_;
  looped_ = false;
  reset_on_end_ = false;
  time_position_ = 0;
  speed_ = 1;
  paused_ = false;

  private ended_event_: BindableEvent = new Instance("BindableEvent");
  readonly on_ended_: RBXScriptSignal = this.ended_event_.Event;

  private looped_event_: BindableEvent = new Instance("BindableEvent");
  readonly on_looped_: RBXScriptSignal = this.looped_event_.Event;

  private update_connection_?: RBXScriptConnection;
  private is_stopped_ = true;

  private animator_?: IAnimator;
  constructor(object: T, object_data: Folder, length: number = GetLength(object_data)) {
    this.length_ = length;
    if (this.length_ === -1) {
      warn(`Animation malformed`);
    }

    if (object.IsA("BasePart")) {
      this.animator_ = new BasePartAnimation(object, object_data);
      return;
    }
    warn(`${object.ClassName} is not supported`);
  }

  Play() {
    //dont play if animation's malformed
    if (this.length_ === -1) return;

    this.Stop();
    this.is_stopped_ = false;
    this.update_connection_ = RunService.Stepped.Connect((_, delta_time) => this.Update(delta_time));
  }

  private Update(delta_time: number): void {
    if (this.paused_) return;
    this.time_position_ = this.time_position_ + delta_time * this.speed_;
    if (this.time_position_ >= this.length_ || this.time_position_ <= 0) {
      if (this.looped_) {
        this.looped_event_.Fire();
        this.time_position_ = WrapAdd(this.time_position_, 0, 0, this.length_);
      } else {
        this.ended_event_.Fire();
        this.time_position_ = clamp(this.time_position_, 0, this.length_);
        this.Stop();
      }
    }

    //calculates the frame and plays the animation
    const frame = this.time_position_ * fps;
    this.animator_?.SetFrame(frame);
  }

  IsStopped() {
    return this.is_stopped_;
  }

  Stop() {
    this.time_position_ = 0;
    this.update_connection_?.Disconnect();
    this.is_stopped_ = true;

  }
}