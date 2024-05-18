export namespace StateControl {
	export interface IState {
		name: string;
		OnEnter: () => void;
		OnLeave: () => void;
		Tick: () => void;
	}

	class StateTransition {
		public to_: IState;
		public Condition: () => boolean;
		constructor(to: IState, condition: () => boolean) {
			this.to_ = to;
			this.Condition = condition;
		}
	}

	const empty_transitions_list: Array<StateTransition> = [];

	export class StateMachine {
		private current_state_?: IState;

		private any_transitions_: Array<StateTransition> = [];
		private transitions_: Map<string, Array<StateTransition>> = new Map<string, Array<StateTransition>>();
		private current_transitions_: Array<StateTransition> = empty_transitions_list;

		Init(start_state: IState) {
			this.SetState(start_state);
		}

		Tick() {
			this.CheckAnyTransitions();
			this.CheckTransitions();
			this.current_state_?.Tick();
		}

		AddTransition(from: IState, to: IState, condition: () => boolean) {
			const new_transition = new StateTransition(to, condition);
			if (!this.transitions_.has(from.name)) {
				//will add an array with state transition;
				this.transitions_.set(from.name, [new_transition]);
				return;
			}

			this.transitions_.get(from.name)!.push(new_transition);
		}

		AddAnyTransition(to: IState, condition: () => boolean) {
			const new_transition = new StateTransition(to, condition);
			this.any_transitions_.push(new_transition);
		}

		private CheckTransitions() {
			for (const transition of this.current_transitions_) {
				if (!transition.Condition()) continue;
				this.SetState(transition.to_);
				break;
			}
		}

		private CheckAnyTransitions() {
			for (const transition of this.any_transitions_) {
				if (!transition.Condition()) continue;
				this.SetState(transition.to_);
				break;
			}
		}

		private SetState(new_state: IState) {
			if (this.current_state_ === new_state) return;
			this.current_state_?.OnLeave();
			this.current_state_ = new_state;
			this.current_transitions_ = this.TryGetTransitions(new_state);
			this.current_state_.OnEnter();
		}

		private TryGetTransitions(state: IState) {
			return this.transitions_.get(state.name) || empty_transitions_list;
		}
	}
}
