"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface CompareHotel {
  id: string;
  slug: string;
  name: string;
  city: string;
  starRating: number;
  propertyType: string;
  amenities: string[];
  images: string[];
  minPrice: number;
  avgReview: number | null;
  reviewCount: number;
}

interface CompareContextType {
  hotels: CompareHotel[];
  add: (hotel: CompareHotel) => void;
  remove: (id: string) => void;
  isAdded: (id: string) => boolean;
  clear: () => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const CompareContext = createContext<CompareContextType>({
  hotels: [],
  add: () => {},
  remove: () => {},
  isAdded: () => false,
  clear: () => {},
  isOpen: false,
  setOpen: () => {},
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [hotels, setHotels] = useState<CompareHotel[]>([]);
  const [isOpen, setOpen] = useState(false);

  const add = (hotel: CompareHotel) => {
    if (hotels.length >= 3) return; // max 3
    if (hotels.find((h) => h.id === hotel.id)) return;
    setHotels((p) => [...p, hotel]);
  };

  const remove = (id: string) => {
    setHotels((p) => p.filter((h) => h.id !== id));
    if (hotels.length <= 1) setOpen(false);
  };

  const clear = () => {
    setHotels([]);
    setOpen(false);
  };
  const isAdded = (id: string) => hotels.some((h) => h.id === id);

  return (
    <CompareContext.Provider
      value={{ hotels, add, remove, isAdded, clear, isOpen, setOpen }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
