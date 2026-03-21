import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NepalStay database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 12);

  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nepalstay.com" },
    update: {},
    create: { name: "Admin User", email: "admin@nepalstay.com", password: adminPassword, role: "ADMIN", phone: "+977-9800000001" },
  });
  const vendor1 = await prisma.user.upsert({
    where: { email: "vendor1@nepalstay.com" },
    update: {},
    create: { name: "Raj Shrestha", email: "vendor1@nepalstay.com", password: hashedPassword, role: "VENDOR", phone: "+977-9841000001" },
  });
  const vendor2 = await prisma.user.upsert({
    where: { email: "vendor2@nepalstay.com" },
    update: {},
    create: { name: "Sita Gurung", email: "vendor2@nepalstay.com", password: hashedPassword, role: "VENDOR", phone: "+977-9841000002" },
  });
  // Third vendor — one hotel per vendor (unique constraint on vendorId)
  const vendor3 = await prisma.user.upsert({
    where: { email: "vendor3@nepalstay.com" },
    update: {},
    create: { name: "Binod Thapa", email: "vendor3@nepalstay.com", password: hashedPassword, role: "VENDOR", phone: "+977-9841000003" },
  });
  const staff1 = await prisma.user.upsert({
    where: { email: "staff@nepalstay.com" },
    update: {},
    create: { name: "Ram Tamang", email: "staff@nepalstay.com", password: hashedPassword, role: "STAFF", phone: "+977-9800000003" },
  });
  await prisma.user.upsert({
    where: { email: "customer@nepalstay.com" },
    update: {},
    create: { name: "Priya Maharjan", email: "customer@nepalstay.com", password: hashedPassword, role: "CUSTOMER", phone: "+977-9800000004" },
  });

  // ── Hotels ─────────────────────────────────────────────────────────────────
  const hotel1 = await prisma.hotel.upsert({
    where: { slug: "himalayan-heritage-hotel-kathmandu" },
    update: {},
    create: {
      vendorId:    vendor1.id,
      name:        "Himalayan Heritage Hotel",
      slug:        "himalayan-heritage-hotel-kathmandu",
      description: "A luxury heritage hotel in the heart of Thamel, Kathmandu. Experience authentic Nepali hospitality with stunning views of the Himalayan range. Steps away from Pashupatinath Temple and Boudhanath Stupa.",
      status:      "APPROVED",
      city:        "Kathmandu",
      address:     "Thamel, Kathmandu 44600",
      latitude:    27.7172,
      longitude:   85.3240,
      starRating:  4,
      propertyType: "Hotel",
      amenities:   ["WiFi", "Parking", "Restaurant", "Bar", "Gym", "Mountain View"],
      contactPhone: "+977-01-4701234",
      contactEmail: "info@himalayanheritage.com",
      policies:    {
        checkIn: "14:00",
        checkOut: "11:00",
        cancellation: "Free cancellation up to 48 hours before check-in",
      },
      approvedAt:  new Date(),
      approvedBy:  admin.id,
    },
  });

  const hotel2 = await prisma.hotel.upsert({
    where: { slug: "lakeside-serenity-resort-pokhara" },
    update: {},
    create: {
      vendorId:    vendor2.id,   // vendor2 owns Pokhara hotel
      name:        "Lakeside Serenity Resort",
      slug:        "lakeside-serenity-resort-pokhara",
      description: "Nestled on the banks of Phewa Lake in Pokhara, this boutique resort offers breathtaking views of the Annapurna range. Perfect for trekkers, paragliders, and nature lovers seeking tranquil accommodation.",
      status:      "APPROVED",
      city:        "Pokhara",
      address:     "Lakeside, Pokhara 33700",
      latitude:    28.2096,
      longitude:   83.9856,
      starRating:  4,
      propertyType: "Resort",
      amenities:   ["WiFi", "Restaurant", "Pool", "Garden", "Mountain View", "Spa"],
      contactPhone: "+977-061-465432",
      contactEmail: "stay@lakesideserenity.com",
      policies:    {
        checkIn: "13:00",
        checkOut: "12:00",
        cancellation: "50% refund for cancellations 3–7 days before check-in",
      },
      approvedAt:  new Date(),
      approvedBy:  admin.id,
    },
  });

  const hotel3 = await prisma.hotel.upsert({
    where: { slug: "chitwan-jungle-lodge" },
    update: {},
    create: {
      vendorId:    vendor3.id,   // vendor3 owns Chitwan hotel
      name:        "Chitwan Jungle Lodge",
      slug:        "chitwan-jungle-lodge",
      description: "An eco-friendly lodge at the edge of Chitwan National Park. Experience wildlife safaris, elephant walks, and canoe rides along the Rapti River. A nature lover's paradise with authentic Tharu cultural programmes.",
      status:      "APPROVED",
      city:        "Chitwan",
      address:     "Sauraha, Chitwan 44200",
      latitude:    27.5799,
      longitude:   84.4985,
      starRating:  3,
      propertyType: "Lodge",
      amenities:   ["WiFi", "Restaurant", "Parking", "Garden"],
      contactPhone: "+977-056-580123",
      contactEmail: "info@chitwanjunglelodge.com",
      policies:    {
        checkIn: "12:00",
        checkOut: "10:00",
        cancellation: "Full refund up to 7 days before check-in",
      },
      approvedAt:  new Date(),
      approvedBy:  admin.id,
    },
  });

  // Assign staff to hotel1
  await prisma.user.update({
    where: { id: staff1.id },
    data: { staffHotelId: hotel1.id },
  });

  // ── Rooms ───────────────────────────────────────────────────────────────────
  await prisma.room.createMany({
    skipDuplicates: true,
    data: [
      // Hotel 1 — Himalayan Heritage
      {
        hotelId: hotel1.id, name: "Standard Room", type: "SINGLE",
        pricePerNight: 3500, capacity: 2, floor: 1, totalRooms: 5,
        description: "Comfortable standard room with city view, en-suite bathroom, and complimentary breakfast.",
        amenities: ["WiFi", "AC", "TV", "Hot Water"],
      },
      {
        hotelId: hotel1.id, name: "Deluxe Mountain View", type: "DOUBLE",
        pricePerNight: 6500, capacity: 2, floor: 3, totalRooms: 4,
        description: "Spacious deluxe room with panoramic Himalayan views, king bed, and premium amenities.",
        amenities: ["WiFi", "AC", "TV", "Hot Water", "Minibar", "Mountain View"],
      },
      {
        hotelId: hotel1.id, name: "Executive Suite", type: "SUITE",
        pricePerNight: 12000, capacity: 4, floor: 5, totalRooms: 2,
        description: "Luxurious suite with separate living area, private balcony, and butler service.",
        amenities: ["WiFi", "AC", "TV", "Hot Water", "Minibar", "Bathtub", "Mountain View"],
      },

      // Hotel 2 — Lakeside Serenity
      {
        hotelId: hotel2.id, name: "Lake View Room", type: "DOUBLE",
        pricePerNight: 5500, capacity: 2, floor: 1, totalRooms: 6,
        description: "Elegant room with direct views of Phewa Lake and Annapurna range. Private balcony included.",
        amenities: ["WiFi", "AC", "Hot Water", "Balcony", "Mountain View"],
      },
      {
        hotelId: hotel2.id, name: "Garden Cottage", type: "DOUBLE",
        pricePerNight: 4200, capacity: 3, floor: 1, totalRooms: 4,
        description: "Charming standalone cottage surrounded by tropical garden. Perfect for families.",
        amenities: ["WiFi", "AC", "Hot Water", "Garden View"],
      },
      {
        hotelId: hotel2.id, name: "Honeymoon Suite", type: "SUITE",
        pricePerNight: 9500, capacity: 2, floor: 2, totalRooms: 2,
        description: "Romantic suite with jacuzzi, rose petal setup, and private rooftop deck overlooking the lake.",
        amenities: ["WiFi", "AC", "Hot Water", "Jacuzzi", "Lake View", "Minibar"],
      },

      // Hotel 3 — Chitwan Jungle Lodge
      {
        hotelId: hotel3.id, name: "Jungle Deluxe Room", type: "DOUBLE",
        pricePerNight: 3800, capacity: 2, floor: 1, totalRooms: 8,
        description: "Comfortable room with jungle views. Wake up to bird calls and elephant sightings.",
        amenities: ["WiFi", "Hot Water", "Fan", "Mosquito Net"],
      },
      {
        hotelId: hotel3.id, name: "Dormitory Bed", type: "DORMITORY",
        pricePerNight: 800, capacity: 1, floor: 1, totalRooms: 10,
        description: "Budget-friendly dormitory for backpackers and solo travellers.",
        amenities: ["WiFi", "Hot Water", "Locker"],
      },
    ],
  });

  console.log("\n✅ Seeding complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("  Admin:    admin@nepalstay.com   / admin123");
  console.log("  Vendor 1: vendor1@nepalstay.com / password123  (Himalayan Heritage, Kathmandu)");
  console.log("  Vendor 2: vendor2@nepalstay.com / password123  (Lakeside Serenity, Pokhara)");
  console.log("  Vendor 3: vendor3@nepalstay.com / password123  (Chitwan Jungle Lodge)");
  console.log("  Staff:    staff@nepalstay.com   / password123");
  console.log("  Customer: customer@nepalstay.com / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
