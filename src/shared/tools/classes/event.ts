export class Event<Arguments extends unknown[] = []> {
  private event_: BindableEvent<(...args: Arguments) => void> = new Instance("BindableEvent");
  readonly on_event_: RBXScriptSignal<(...args: Arguments) => void> = this.event_.Event
  Fire(...args: Arguments) {
    this.event_.Fire(...args);
  }
  Destroy() {
    this.event_.Destroy();
  }
}
