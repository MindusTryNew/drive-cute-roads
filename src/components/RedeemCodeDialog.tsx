import { useState } from "react";
import { redeemCode } from "@/lib/premium-codes";
import { toast } from "sonner";

export function RedeemCodeDialog({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");

  const submit = () => {
    const res = redeemCode(code);
    if (res.ok) {
      toast.success(`🎁 Code eingelöst: ${res.label}`);
      onClose();
    } else {
      toast.error(res.reason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold">🎁 Premium-Code einlösen</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Jeder Code ist nur einmal einlösbar. Freischaltungen bleiben in diesem Browser gespeichert.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Z.B. D3VM0DE999XXX"
          autoFocus
          className="mt-4 w-full rounded-lg border bg-background px-3 py-2 font-mono tracking-widest outline-none focus:border-primary"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:border-primary">
            Abbrechen
          </button>
          <button onClick={submit} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Einlösen
          </button>
        </div>
      </div>
    </div>
  );
}
