import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type Pose = {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  ry: number;
  speed: number;
};

export type RoomHandle = {
  channel: RealtimeChannel;
  send: (pose: Pose) => void;
  onPose: (cb: (pose: Pose) => void) => void;
  onLeave: (cb: (id: string) => void) => void;
  destroy: () => void;
  selfId: string;
};

export function joinRoom(code: string, selfId: string, name: string, color: string): RoomHandle {
  const channel = supabase.channel(`drift-room:${code}`, {
    config: { broadcast: { self: false }, presence: { key: selfId } },
  });

  const poseCbs: Array<(p: Pose) => void> = [];
  const leaveCbs: Array<(id: string) => void> = [];

  channel.on("broadcast", { event: "pose" }, ({ payload }) => {
    const p = payload as Pose;
    if (p.id === selfId) return;
    for (const cb of poseCbs) cb(p);
  });

  channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
    for (const pres of leftPresences as Array<{ id?: string }>) {
      const id = pres.id ?? "";
      if (id) for (const cb of leaveCbs) cb(id);
    }
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ id: selfId, name, color });
    }
  });

  return {
    channel,
    selfId,
    send: (pose) => {
      channel.send({ type: "broadcast", event: "pose", payload: pose });
    },
    onPose: (cb) => { poseCbs.push(cb); },
    onLeave: (cb) => { leaveCbs.push(cb); },
    destroy: () => { supabase.removeChannel(channel); },
  };
}

export function randomRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
