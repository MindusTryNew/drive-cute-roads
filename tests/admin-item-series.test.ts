import { describe, expect, mock, test } from "bun:test";

const calls: { name: string; args: unknown }[] = [];
mock.module("../src/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "admin-test" } } }) },
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      return { data: true, error: null };
    },
  },
}));
const { createSingleItem } = await import("../src/lib/admin");
const item = { item_key: "adm-panda", name: "Panda", emoji: "🐼", description: "", rarity_key: "rare", effect: {}, series_key: null };

describe("Individual item series assignment", () => {
  test("passes the selected series and item key to the atomic save", async () => {
    await createSingleItem(item, "series-animals");
    expect(calls.at(-1)).toEqual({ name: "create_single_item_in_series", args: { _item: item, _series_id: "series-animals" } });
  });
  test("allows creating an item without a series", async () => {
    await createSingleItem(item, null);
    expect(calls.at(-1)).toEqual({ name: "create_single_item_in_series", args: { _item: item, _series_id: undefined } });
  });
});