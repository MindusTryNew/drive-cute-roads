import { describe, expect, test } from "bun:test";
import { readDrivingPads, stickValue } from "./gamepad";

function pad(index = 0): Omit<Gamepad, "axes" | "buttons"> & { axes: number[]; buttons: GamepadButton[] } {
  return { index, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 18 }, () => ({ value: 0, pressed: false, touched: false })), id: "DualSense", timestamp: 0, vibrationActuator: null } as unknown as Omit<Gamepad, "axes" | "buttons"> & { axes: number[]; buttons: GamepadButton[] };
}

describe("DualSense driving", () => {
  test("left stick is proportional with neutral drift protection", () => {
    expect(stickValue(0.1)).toBe(0);
    expect(stickValue(0.56)).toBeCloseTo(0.5);
    const p = pad(); p.axes = [-1, 0, 0, 0];
    expect(readDrivingPads([p])[0]?.steer).toBe(1);
  });
  test("R2 accelerates, L2 brakes/reverses, Cross handbrakes", () => {
    const p = pad();
    p.buttons[7] = { value: 0.5, pressed: true, touched: true };
    expect(readDrivingPads([p])[0]?.throttle).toBe(0.5);
    p.buttons[7] = { value: 0, pressed: false, touched: false };
    p.buttons[6] = { value: 1, pressed: true, touched: true };
    p.buttons[0] = { value: 1, pressed: true, touched: true };
    expect(readDrivingPads([p])[0]).toMatchObject({ throttle: -0.7, handbrake: 1 });
  });
  test("Options/touchpad open map and Circle cancels", () => {
    const p = pad();
    p.buttons[9] = { value: 1, pressed: true, touched: true };
    p.buttons[1] = { value: 1, pressed: true, touched: true };
    expect(readDrivingPads([p])[0]).toMatchObject({ map: true, cancel: true });
    p.buttons[9] = { value: 0, pressed: false, touched: false };
    p.buttons[17] = { value: 1, pressed: true, touched: true };
    expect(readDrivingPads([p])[0]?.map).toBe(true);
  });
  test("disconnected and unmapped pads are ignored; split players use index order", () => {
    const disconnected = { ...pad(), connected: false };
    const unmapped = { ...pad(), mapping: "" } as Gamepad;
    expect(readDrivingPads([null, disconnected, unmapped])).toEqual([]);
    expect(readDrivingPads([pad(3), null, pad(1)]).map(p => p.index)).toEqual([1, 3]);
  });
});