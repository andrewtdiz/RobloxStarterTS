export namespace Springs {
  export class Spring {
    private stiffness_: number;
    private dumping_factor_: number;
    private current_value_: number;
    constructor(stiffness: number, dumping_factor: number, start_value: number) {
      this.stiffness_ = stiffness;
      this.dumping_factor_ = dumping_factor;
      this.current_value_ = start_value;
    }
    Update(delta_time: number, target_value: number) {
      const distance = target_value - this.current_value_;
      const spring_force = distance * this.stiffness_;
      const dumping_force = spring_force * -this.dumping_factor_;
      const total_force = spring_force + dumping_force
      this.current_value_ += total_force * delta_time
      return this.current_value_
    }
  }
}