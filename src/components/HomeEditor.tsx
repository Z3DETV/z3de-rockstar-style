"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/public";

type Item = {
  id: string;
  name: string;
  slug: string;
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
};

type UserItem = {
  id: string;
  qty: number;
  item: Item;
};

type Equipped = {
  slot: Slot;
  item: Item;
};

type Slot = "wall" | "floor" | "furniture_1" | "decor_1" | "decor_2" | "effect_1";

const SLOTS: Slot[] = ["wall", "floor", "furniture_1", "decor_1", "decor_2", "effect_1"];

function getErrorMessage(err: unknown) {
  if (!err) return "Une erreur est survenue.";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err && "message" in err) return String((err as any).message);
  return "Une erreur est survenue.";
}

export default function HomeEditor({ userId }: { userId: string }) {
  const [points, setPoints] = useState<number>(0);
  const [shop, setShop] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<UserItem[]>([]);
  const [equipped, setEquipped] = useState<Equipped[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const equippedBySlot = useMemo(() => {
    const map = new Map<Slot, Item>();
    for (const e of equipped) map.set(e.slot, e.item);
    return map;
  }, [equipped]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    // 1) Points
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("z_points")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      setError(getErrorMessage(profileError));
      setLoading(false);
      return;
    }

    // 2) Shop (catalog)
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id, name, slug, price, rarity")
      .order("price");

    if (itemsError) {
      setError(getErrorMessage(itemsError));
      setLoading(false);
      return;
    }

    // 3) Inventory (join items via alias)
    const { data: inv, error: invError } = await supabase
      .from("user_items")
      .select("id, qty, item:items(id, name, slug, price, rarity)")
      .eq("user_id", userId);

    if (invError) {
      setError(getErrorMessage(invError));
      setLoading(false);
      return;
    }

    // 4) Equipped (home_equipped -> user_items -> items)
    const { data: eq, error: eqError } = await supabase
      .from("home_equipped")
      .select("slot, user_item:user_items(item:items(id, name, slug, price, rarity))")
      .eq("user_id", userId);

    if (eqError) {
      setError(getErrorMessage(eqError));
      setLoading(false);
      return;
    }

    setPoints(profile?.z_points ?? 0);
    setShop((items ?? []) as Item[]);

    // Normalize inventory to match our types
    setInventory(
      (inv ?? [])
        .map((row: any) => {
          if (!row?.item) return null;
          return {
            id: String(row.id),
            qty: Number(row.qty ?? 1),
            item: row.item as Item,
          } satisfies UserItem;
        })
        .filter(Boolean) as UserItem[]
    );

    // Normalize equipped
    setEquipped(
      (eq ?? [])
        .map((row: any) => {
          const slot = row?.slot as Slot | undefined;
          const item = row?.user_item?.item as Item | undefined;
          if (!slot || !item) return null;
          if (!SLOTS.includes(slot)) return null;

          return { slot, item } satisfies Equipped;
        })
        .filter(Boolean) as Equipped[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function buy(slug: string) {
    setBusy(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("buy_item", {
      p_item_slug: slug,
      p_qty: 1,
    });

    if (rpcError) setError(getErrorMessage(rpcError));

    await loadAll();
    setBusy(false);
  }

  async function equip(userItemId: string, slot: Slot) {
    setBusy(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("equip_item", {
      p_user_item_id: userItemId,
      p_slot: slot,
    });

    if (rpcError) setError(getErrorMessage(rpcError));

    await loadAll();
    setBusy(false);
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🏠 Ma Maison</h1>
        <div className="text-lg">💰 {points} pts</div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Equipped */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Équipé</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SLOTS.map((slot) => {
            const item = equippedBySlot.get(slot);

            return (
              <div
                key={slot}
                className="border border-white/10 rounded-lg p-3 bg-black/30"
              >
                <div className="text-sm text-white/60">{slot}</div>
                <div className="font-medium">{item ? item.name : "—"}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Shop */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">🛒 Boutique</h2>
          {busy && <div className="text-sm text-white/60">Action en cours…</div>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {shop.map((item) => (
            <div
              key={item.id}
              className="border border-white/10 rounded-xl p-3 bg-black/40"
            >
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-white/60">
                {item.rarity} • {item.price} pts
              </div>

              <button
                disabled={busy || points < item.price}
                onClick={() => buy(item.slug)}
                className="mt-2 w-full bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 rounded py-1 text-sm"
              >
                Acheter
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Inventory */}
      <section>
        <h2 className="text-xl font-semibold mb-2">🎒 Inventaire</h2>

        {inventory.length === 0 ? (
          <div className="text-white/60">Ton inventaire est vide.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {inventory.map((ui) => (
              <div
                key={ui.id}
                className="border border-white/10 rounded-xl p-3 bg-black/40"
              >
                <div className="font-semibold">{ui.item.name}</div>
                <div className="text-sm text-white/60">x{ui.qty}</div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {SLOTS.map((slot) => (
                    <button
                      key={slot}
                      disabled={busy}
                      onClick={() => equip(ui.id, slot)}
                      className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
