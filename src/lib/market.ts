// Direct supabase client (anon) — public marketplace, no auth.
import { supabase } from "@/integrations/supabase/client";
import { CustomCarSchema, type CustomCar } from "@/lib/garage";

export type MarketListing = {
  id: string;
  seller_nick: string;
  car_name: string;
  primary_color: string;
  body_type: string;
  top_speed: number;
  time_0_100: number;
  price: number;
  times_purchased: number;
  listed_at: string;
  car_json: unknown;
};

export const MARKET_FEE_PCT = 10;

export function feeFor(price: number): number {
  return Math.ceil(price * (MARKET_FEE_PCT / 100));
}

export async function listMarket(limit = 40): Promise<MarketListing[]> {
  const { data, error } = await supabase
    .from("market_cars")
    .select("id, seller_nick, car_name, primary_color, body_type, top_speed, time_0_100, price, times_purchased, listed_at, car_json")
    .order("listed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MarketListing[];
}

export async function publishCar(car: CustomCar, sellerNick: string, price: number): Promise<void> {
  const { error } = await supabase.from("market_cars").insert({
    seller_nick: sellerNick.trim(),
    car_name: car.name,
    primary_color: car.appearance.primaryColor,
    body_type: car.appearance.bodyType,
    top_speed: car.tuning.topSpeed,
    time_0_100: car.tuning.time0to100,
    price,
    car_json: car,
  });
  if (error) throw error;
}

export async function purchaseListing(listing: MarketListing): Promise<CustomCar> {
  // Validate stored car JSON
  const car = CustomCarSchema.parse(listing.car_json);
  car.id = crypto.randomUUID();
  car.createdAt = Date.now();
  // Bump counter (best-effort; failure doesn't block the purchase locally)
  await supabase.rpc("increment_market_purchase", { _id: listing.id }).catch(() => {});
  return car;
}

const NICK_KEY = "garage:sellerNick";
export function getSellerNick(): string {
  return localStorage.getItem(NICK_KEY) ?? "";
}
export function setSellerNick(n: string) {
  localStorage.setItem(NICK_KEY, n);
}
