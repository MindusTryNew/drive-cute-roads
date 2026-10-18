/** Browser-standard DualSense mapping; no browser APIs are accessed on import. */
export type DrivingPad = {
  index: number;
  steer: number;
  throttle: number;
  handbrake: number;
  map: boolean;
  cancel: boolean;
};

export function stickValue(value: number, deadzone = 0.12): number {
  if (!Number.isFinite(value) || Math.abs(value) <= deadzone) return 0;
  return Math.sign(value) * Math.min(1, (Math.abs(value) - deadzone) / (1 - deadzone));
}

export function readDrivingPads(pads: readonly (Gamepad | null)[]): DrivingPad[] {
  return pads.filter((pad): pad is Gamepad => Boolean(pad?.connected && pad.mapping === "standard"))
    .sort((a, b) => a.index - b.index)
    .map((pad) => {
      const button = (index: number) => {
        const value = pad.buttons[index]?.value ?? 0;
        return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
      };
      return {
        index: pad.index,
        steer: -stickValue(pad.axes[0] ?? 0),
        throttle: button(7) - button(6) * 0.7,
        handbrake: button(0),
        map: Boolean(pad.buttons[17]?.pressed || pad.buttons[9]?.pressed),
        cancel: Boolean(pad.buttons[1]?.pressed),
      };
    });
}