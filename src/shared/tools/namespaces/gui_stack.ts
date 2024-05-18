export namespace GuiStack {
	const stack_list = new Array<GuiElement>();

	export const enum EOnShownAction {
		hide_other = "hide_other",
		none = "none",
	}

	function EvaluateStack() {
		//to prevent problems when gui is added
		const stack_list_clone = table.clone(stack_list);
		const stack_hidden_status = new Array<boolean>(stack_list_clone.size(), false);

		const HideEverythingAtPriorityOrLower = (priority: number, exceptions: GuiElement[]) => {
			for (const i of $range(0, stack_list_clone.size() - 1)) {
				const stack_element = stack_list_clone[i];
				//dont hide if in exceptions
				if (exceptions.includes(stack_element)) continue;
				if (stack_element.GetPriority() > priority) continue;
				//stack element and hidden_status have the same index [i]
				//makes the gui hidden
				stack_hidden_status[i] = true;
			}
		};

		for (const stack_element of stack_list_clone) {
			if (!stack_element.IsEnabled()) continue;
			const on_shown_action = stack_element.GetOnShownAction();
			if (on_shown_action === EOnShownAction.none) continue;
			//hides other guis
			HideEverythingAtPriorityOrLower(stack_element.GetPriority(), [stack_element]);
		}

		stack_hidden_status.forEach((hidden_statis, index) => {
			const stack_element = stack_list_clone[index];
			stack_element.SetHidden(hidden_statis);
		});
	}

	export class GuiElement {
		readonly gui_: ScreenGui;
		/**whether should be hidden by other gui */
		private hidden_ = false;
		private enabled_ = false;

		/**current status */
		private is_enabled_ = false;

		/**gui's with the same / lower priorities will be hidden */
		private priority_ = 0;
		private on_shown_action_: EOnShownAction;

		private shown_event_ = new Instance("BindableEvent");
		/**fires when gui becomes visible */
		readonly on_shown_ = this.shown_event_.Event;
		private hidden_event_ = new Instance("BindableEvent");
		/**fires when gui becomes hidden / not visible */
		readonly on_hidden_ = this.hidden_event_.Event;

		constructor(gui: ScreenGui, on_shown_action: EOnShownAction = EOnShownAction.none, priority: number = 0) {
			//disables the gui by default
			gui.Enabled = false;

			this.gui_ = gui;
			this.priority_ = priority;
			this.on_shown_action_ = on_shown_action;

			//adds itself to the list;
			stack_list.push(this);
		}

		private EvaluateEnabledStatus() {
			const should_be_enabled = !this.hidden_ && this.enabled_;
			if (this.is_enabled_ === should_be_enabled) return;
			this.is_enabled_ = should_be_enabled;
			this.gui_.Enabled = should_be_enabled;

			/**chooses the event to fire */
			const event = should_be_enabled ? this.shown_event_ : this.hidden_event_;
			event.Fire();
		}

		GetOnShownAction() {
			return this.on_shown_action_;
		}

		/**@returns whether the gui is visible */
		GetEnabledStatus() {
			return this.is_enabled_;
		}

		GetPriority() {
			return this.priority_;
		}

		/**@hidden */
		SetHidden(value: boolean) {
			this.hidden_ = value;
			this.EvaluateEnabledStatus();
		}

		SetEnabled(value: boolean) {
			this.enabled_ = value;
			//evaluates the stack
			EvaluateStack();
		}

		/**@returns whether the gui wants to be enabled, but it can be not visible or visible */
		IsEnabled() {
			return this.enabled_;
		}

		/**@returns whether the gui is hidden by others */
		IsHidden() {
			return this.hidden_;
		}

		Destroy() {
			this.shown_event_.Destroy();
			this.hidden_event_.Destroy();
			this.gui_.Destroy();
		}
	}
}
