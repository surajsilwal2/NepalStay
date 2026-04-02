import type { Metadata } from "next";
import HotelsClient from "./HotelsClient";

export const metadata: Metadata = {
  title: "Browse Hotels in Nepal",
  description:
    "Search and book hotels across Nepal — Kathmandu, Pokhara, Chitwan, Nagarkot and beyond. Filter by city, price, stars and property type.",
  openGraph: {
    title: "Browse Hotels in Nepal | NepalStay",
    description: "Find your perfect stay in Nepal. Compare prices, ratings and amenities.",
  },
};

export default function HotelsPage() {
  return <HotelsClient />;
}
