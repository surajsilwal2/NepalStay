import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NepalStay database with optimized data...\n");

  // ✅ SAFETY: Require explicit opt-in for destructive cleanup
  if (process.env.SEED_MODE !== "demo") {
    console.error(
      "❌ Destructive seed cleanup is disabled. " +
      "Run with SEED_MODE=demo to allow cleanup and demo reseeding."
    );

    process.exit(1);
  }

  // ✅ Clear existing demo data to avoid unique constraint violations
  console.log("🧹 Cleaning up existing demo data...");
  await prisma.roomStatusLog.deleteMany({});
  await prisma.room.deleteMany({});
  console.log("✅ Cleaned up\n");

  const hashedPassword = await bcrypt.hash("password123", 12);
  const adminPassword = await bcrypt.hash("admin123", 12);
  

  // ────────────────────────────────────────────────────────────────────────
  // USERS
  // ────────────────────────────────────────────────────────────────────────

  console.log("👥 Creating users...");

  // ADMIN
  const admin = await prisma.user.upsert({
    where: { email: "admin@nepalstay.com" },
    update: {},
    create: {
      name: "Admin NepalStay",
      email: "admin@nepalstay.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "+977-1-4000001",
      nationality: "NEPALI",
    },
  });

  // VENDOR 1 — Small Hotel Owner
  const vendor1 = await prisma.user.upsert({
    where: { email: "rajesh@urbanboutique.com" },
    update: {},
    create: {
      name: "Rajesh Shrestha",
      email: "rajesh@urbanboutique.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841234567",
      nationality: "NEPALI",
    },
  });

  // VENDOR 2 — Large Hotel Owner
  const vendor2 = await prisma.user.upsert({
    where: { email: "sita@mountainlodge.com" },
    update: {},
    create: {
      name: "Sita Gurung",
      email: "sita@mountainlodge.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9842234567",
      nationality: "NEPALI",
    },
  });

  // STAFF for Small Hotel
  const staff1 = await prisma.user.upsert({
    where: { email: "ramesh@urbanboutique.com" },
    update: {},
    create: {
      name: "Ramesh Tamang",
      email: "ramesh@urbanboutique.com",
      password: hashedPassword,
      role: "STAFF",
      phone: "+977-9843234567",
      nationality: "NEPALI",
    },
  });

  // STAFF for Large Hotel
  const staff2 = await prisma.user.upsert({
    where: { email: "maya@mountainlodge.com" },
    update: {},
    create: {
      name: "Maya Rai",
      email: "maya@mountainlodge.com",
      password: hashedPassword,
      role: "STAFF",
      phone: "+977-9844234567",
      nationality: "NEPALI",
    },
  });

  // CUSTOMERS
  const customer1 = await prisma.user.upsert({
    where: { email: "traveler@example.com" },
    update: {},
    create: {
      name: "John Traveler",
      email: "traveler@example.com",
      password: hashedPassword,
      role: "CUSTOMER",
      phone: "+977-9845234567",
      nationality: "NEPALI",
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "foreign@example.com" },
    update: {},
    create: {
      name: "Sarah Smith",
      email: "foreign@example.com",
      password: hashedPassword,
      role: "CUSTOMER",
      phone: "+1-555-1234",
      nationality: "FOREIGN",
      passportNumber: "GB123456",
      purposeOfVisit: "LEISURE",
    },
  });

  console.log("✅ Users created\n");

  // ────────────────────────────────────────────────────────────────────────
  // HOTELS
  // ────────────────────────────────────────────────────────────────────────

  console.log("🏨 Creating hotels...");

  // HOTEL 1: Small Boutique (8 rooms, 2 floors)
  const hotel1 = await prisma.hotel.upsert({
    where: { slug: "urban-kathmandu-boutique" },
    update: {},
    create: {
      vendorId: vendor1.id,
      name: "Urban Kathmandu Boutique",
      slug: "urban-kathmandu-boutique",
      description:
        "A cozy 8-room boutique hotel in the heart of Thamel with personalized service and rooftop garden offering Himalayan views. Perfect for couples and small families seeking authentic Nepali hospitality.",
      status: "APPROVED",
      city: "Kathmandu",
      address: "Thamel, Kathmandu 44600, Nepal",
      latitude: 27.7172,
      longitude: 85.324,
      starRating: 4,
      propertyType: "Boutique Hotel",
      amenities: ["WiFi", "Restaurant", "Rooftop Garden", "Parking", "Mountain View", "Room Service"],
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&h=800&fit=crop&q=80",
      ],
      contactPhone: "+977-1-4701234",
      contactEmail: "info@urbanboutique.com",
      policies: {
        checkIn: "14:00",
        checkOut: "11:00",
        cancellation: "Free cancellation up to 48 hours before check-in",
      },
      hotelSize: "SMALL",
      staffEnabled: false,
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Assign staff to small hotel
  await prisma.user.update({
    where: { id: staff1.id },
    data: { staffHotelId: hotel1.id },
  });

  // HOTEL 2: Large Mountain Lodge (32 rooms, 3 floors + basement)
  const hotel2 = await prisma.hotel.upsert({
    where: { slug: "pokhara-mountain-lodge" },
    update: {},
    create: {
      vendorId: vendor2.id,
      name: "Pokhara Mountain Lodge",
      slug: "pokhara-mountain-lodge",
      description:
        "A prestigious 32-room mountain lodge overlooking Phewa Lake and the Annapurna range. Ideal for trekkers, corporate groups, and nature lovers. Features conference facilities, spa services, and adventure desk.",
      status: "APPROVED",
      city: "Pokhara",
      address: "Lakeside, Pokhara 33700, Nepal",
      latitude: 28.2096,
      longitude: 83.9856,
      starRating: 5,
      propertyType: "Mountain Lodge",
      amenities: [
        "WiFi",
        "Restaurant",
        "Lake View",
        "Parking",
        "Conference Room",
        "Garden",
        "Spa",
        "Adventure Desk",
        "Bar",
      ],
      images: [
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=1200&h=800&fit=crop&q=80",
      ],
      contactPhone: "+977-61-465432",
      contactEmail: "info@mountainlodge.com",
      policies: {
        checkIn: "13:00",
        checkOut: "12:00",
        cancellation: "50% refund for cancellations 3-7 days before check-in",
      },
      hotelSize: "LARGE",
      staffEnabled: true,
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Assign staff to large hotel
  await prisma.user.update({
    where: { id: staff2.id },
    data: { staffHotelId: hotel2.id },
  });

  console.log("✅ Hotels created\n");

  // ────────────────────────────────────────────────────────────────────────
  // ROOMS - HOTEL 1 (Small Boutique - 8 unique rooms)
  // ────────────────────────────────────────────────────────────────────────

  console.log("🛏️  Creating rooms for Hotel 1 (Small - 8 rooms)...");

  const hotel1Rooms = [
    // FLOOR 1 (4 rooms)
    {
      roomNumber: "101",
      name: "City View Single",
      type: "SINGLE",
      pricePerNight: 3500,
      capacity: 1,
      floor: 1,
      totalRooms: 1,
      description: "Cozy single room with city views and modern amenities.",
      amenities: ["WiFi", "AC", "TV", "Hot Water", "Work Desk"],
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "102",
      name: "City View Double",
      type: "DOUBLE",
      pricePerNight: 6500,
      capacity: 2,
      floor: 1,
      totalRooms: 1,
      description: "Spacious double room with king bed and city views.",
      amenities: ["WiFi", "AC", "TV", "Hot Water", "Balcony", "City View"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "103",
      name: "Twin Beds Superior",
      type: "TWIN",
      pricePerNight: 5500,
      capacity: 2,
      floor: 1,
      totalRooms: 1,
      description: "Perfect for friends or colleagues with two twin beds.",
      amenities: ["WiFi", "AC", "TV", "Hot Water", "Lounge Area"],
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "104",
      name: "Deluxe Family Room",
      type: "DELUXE",
      pricePerNight: 8500,
      capacity: 3,
      floor: 1,
      totalRooms: 1,
      description: "Spacious family room with separate living area.",
      amenities: ["WiFi", "AC", "TV", "Hot Water", "Living Area", "Mountain View"],
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80"],
    },

    // FLOOR 2 (4 rooms)
    {
      roomNumber: "201",
      name: "Mountain View Single",
      type: "SINGLE",
      pricePerNight: 4200,
      capacity: 1,
      floor: 2,
      totalRooms: 1,
      description: "Single room with Himalayan mountain views.",
      amenities: ["WiFi", "AC", "TV", "Hot Water", "Mountain View"],
      images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "202",
      name: "Himalayan View Deluxe",
      type: "DELUXE",
      pricePerNight: 9500,
      capacity: 2,
      floor: 2,
      totalRooms: 1,
      description: "Premium room with panoramic mountain views and private terrace.",
      amenities: ["WiFi", "AC", "TV", "Hot Water", "Terrace", "Minibar", "Mountain View"],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "203",
      name: "Romantic Suite",
      type: "SUITE",
      pricePerNight: 12000,
      capacity: 2,
      floor: 2,
      totalRooms: 1,
      description: "Luxurious suite with hot tub and romantic setup.",
      amenities: ["WiFi", "AC", "TV", "Hot Water", "Hot Tub", "Romantic Lighting", "Premium Bedding"],
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "204",
      name: "Penthouse with Terrace",
      type: "PENTHOUSE",
      pricePerNight: 15000,
      capacity: 4,
      floor: 2,
      totalRooms: 1,
      description: "Exclusive penthouse with full Himalayan view and expansive terrace.",
      amenities: [
        "WiFi",
        "AC",
        "TV",
        "Hot Water",
        "Private Terrace",
        "Minibar",
        "Spa Bath",
        "Premium Bedding",
        "Mountain View",
      ],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },
  ];

  for (const room of hotel1Rooms) {
    await prisma.room.create({
      data: {
        hotelId: hotel1.id,
        ...room,
      },
    });
  }

  console.log("✅ 8 rooms created for Hotel 1\n");

  // ────────────────────────────────────────────────────────────────────────
  // ROOMS - HOTEL 2 (Large Lodge - 32 unique rooms)
  // ────────────────────────────────────────────────────────────────────────

  console.log("🛏️  Creating rooms for Hotel 2 (Large - 32 rooms)...");

  const hotel2Rooms = [
    // FLOOR 1 - Ground Floor - Budget & Dorm (8 rooms)
    {
      roomNumber: "B01",
      name: "Budget Dormitory A",
      type: "DORMITORY",
      pricePerNight: 1200,
      capacity: 1,
      floor: 1,
      totalRooms: 6,
      description: "6-bed dormitory for budget-conscious backpackers.",
      amenities: ["WiFi", "Shared Kitchen", "Locker", "Fan", "Common Area"],
      images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "B02",
      name: "Budget Dormitory B",
      type: "DORMITORY",
      pricePerNight: 1200,
      capacity: 1,
      floor: 1,
      totalRooms: 6,
      description: "6-bed dormitory for budget-conscious backpackers.",
      amenities: ["WiFi", "Shared Kitchen", "Locker", "Fan", "Common Area"],
      images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "B03",
      name: "Budget Single B1",
      type: "SINGLE",
      pricePerNight: 2200,
      capacity: 1,
      floor: 1,
      totalRooms: 1,
      description: "Affordable single room with basic amenities.",
      amenities: ["WiFi", "Hot Water", "Fan"],
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "B04",
      name: "Budget Single B2",
      type: "SINGLE",
      pricePerNight: 2200,
      capacity: 1,
      floor: 1,
      totalRooms: 1,
      description: "Affordable single room with basic amenities.",
      amenities: ["WiFi", "Hot Water", "Fan"],
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "B05",
      name: "Budget Double B1",
      type: "DOUBLE",
      pricePerNight: 3500,
      capacity: 2,
      floor: 1,
      totalRooms: 1,
      description: "Economy double room for budget travelers.",
      amenities: ["WiFi", "Hot Water", "Fan", "Shared Bathroom"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "B06",
      name: "Budget Double B2",
      type: "DOUBLE",
      pricePerNight: 3500,
      capacity: 2,
      floor: 1,
      totalRooms: 1,
      description: "Economy double room for budget travelers.",
      amenities: ["WiFi", "Hot Water", "Fan", "Shared Bathroom"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "B07",
      name: "Budget Twin B1",
      type: "TWIN",
      pricePerNight: 4000,
      capacity: 2,
      floor: 1,
      totalRooms: 1,
      description: "Economy twin room with shared facilities.",
      amenities: ["WiFi", "Hot Water", "Fan"],
      images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "B08",
      name: "Budget Twin B2",
      type: "TWIN",
      pricePerNight: 4000,
      capacity: 2,
      floor: 1,
      totalRooms: 1,
      description: "Economy twin room with shared facilities.",
      amenities: ["WiFi", "Hot Water", "Fan"],
      images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80"],
    },

    // FLOOR 2 - Standard & Lake View (8 rooms)
    {
      roomNumber: "101",
      name: "Standard Single G1",
      type: "SINGLE",
      pricePerNight: 3200,
      capacity: 1,
      floor: 2,
      totalRooms: 1,
      description: "Comfortable standard single room.",
      amenities: ["WiFi", "AC", "Hot Water", "TV"],
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "102",
      name: "Standard Single G2",
      type: "SINGLE",
      pricePerNight: 3200,
      capacity: 1,
      floor: 2,
      totalRooms: 1,
      description: "Comfortable standard single room.",
      amenities: ["WiFi", "AC", "Hot Water", "TV"],
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "103",
      name: "Lake View Double G1",
      type: "DOUBLE",
      pricePerNight: 6200,
      capacity: 2,
      floor: 2,
      totalRooms: 1,
      description: "Room with direct Phewa Lake views.",
      amenities: ["WiFi", "AC", "Hot Water", "Balcony", "Lake View"],
      images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "104",
      name: "Lake View Double G2",
      type: "DOUBLE",
      pricePerNight: 6200,
      capacity: 2,
      floor: 2,
      totalRooms: 1,
      description: "Room with direct Phewa Lake views.",
      amenities: ["WiFi", "AC", "Hot Water", "Balcony", "Lake View"],
      images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "105",
      name: "Lake View Twin G1",
      type: "TWIN",
      pricePerNight: 5500,
      capacity: 2,
      floor: 2,
      totalRooms: 1,
      description: "Twin room with lake and mountain partial views.",
      amenities: ["WiFi", "AC", "Hot Water", "City View"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "106",
      name: "Lake View Twin G2",
      type: "TWIN",
      pricePerNight: 5500,
      capacity: 2,
      floor: 2,
      totalRooms: 1,
      description: "Twin room with lake and mountain partial views.",
      amenities: ["WiFi", "AC", "Hot Water", "City View"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "107",
      name: "Deluxe Family G1",
      type: "DELUXE",
      pricePerNight: 8500,
      capacity: 3,
      floor: 2,
      totalRooms: 1,
      description: "Spacious family room with separate living area and lake view.",
      amenities: ["WiFi", "AC", "Hot Water", "Living Area", "Lake View"],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "108",
      name: "Deluxe Family G2",
      type: "DELUXE",
      pricePerNight: 8500,
      capacity: 3,
      floor: 2,
      totalRooms: 1,
      description: "Spacious family room with separate living area and lake view.",
      amenities: ["WiFi", "AC", "Hot Water", "Living Area", "Lake View"],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },

    // FLOOR 3 - Premium & Annapurna View (8 rooms)
    {
      roomNumber: "201",
      name: "Annapurna View Single",
      type: "SINGLE",
      pricePerNight: 4500,
      capacity: 1,
      floor: 3,
      totalRooms: 1,
      description: "Single room with direct Annapurna range views.",
      amenities: ["WiFi", "AC", "Hot Water", "Mountain View", "Balcony"],
      images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "202",
      name: "Annapurna View Double P1",
      type: "DOUBLE",
      pricePerNight: 7800,
      capacity: 2,
      floor: 3,
      totalRooms: 1,
      description: "Premium double with Annapurna mountain views.",
      amenities: ["WiFi", "AC", "Hot Water", "Balcony", "Mountain View", "Spa Bath"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "203",
      name: "Annapurna View Double P2",
      type: "DOUBLE",
      pricePerNight: 7800,
      capacity: 2,
      floor: 3,
      totalRooms: 1,
      description: "Premium double with Annapurna mountain views.",
      amenities: ["WiFi", "AC", "Hot Water", "Balcony", "Mountain View", "Spa Bath"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "204",
      name: "Mountain View Deluxe P1",
      type: "DELUXE",
      pricePerNight: 10200,
      capacity: 2,
      floor: 3,
      totalRooms: 1,
      description: "Deluxe room with panoramic mountain and lake views.",
      amenities: ["WiFi", "AC", "Hot Water", "Terrace", "Mountain View", "Lake View", "Minibar"],
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "205",
      name: "Mountain View Deluxe P2",
      type: "DELUXE",
      pricePerNight: 10200,
      capacity: 2,
      floor: 3,
      totalRooms: 1,
      description: "Deluxe room with panoramic mountain and lake views.",
      amenities: ["WiFi", "AC", "Hot Water", "Terrace", "Mountain View", "Lake View", "Minibar"],
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "206",
      name: "Honeymoon Suite P1",
      type: "SUITE",
      pricePerNight: 13500,
      capacity: 2,
      floor: 3,
      totalRooms: 1,
      description: "Romantic suite with private hot tub and premium bedding.",
      amenities: ["WiFi", "AC", "Hot Water", "Hot Tub", "Mountain View", "Lake View", "Romantic Setup"],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "207",
      name: "Honeymoon Suite P2",
      type: "SUITE",
      pricePerNight: 13500,
      capacity: 2,
      floor: 3,
      totalRooms: 1,
      description: "Romantic suite with private hot tub and premium bedding.",
      amenities: ["WiFi", "AC", "Hot Water", "Hot Tub", "Mountain View", "Lake View", "Romantic Setup"],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "208",
      name: "Presidential Suite",
      type: "SUITE",
      pricePerNight: 18000,
      capacity: 4,
      floor: 3,
      totalRooms: 1,
      description: "Luxurious presidential suite with multiple rooms and private terrace.",
      amenities: [
        "WiFi",
        "AC",
        "Hot Water",
        "Private Terrace",
        "Mountain View",
        "Lake View",
        "Minibar",
        "Premium Bedding",
        "Spa Bath",
      ],
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80"],
    },

    // FLOOR 4 - Penthouse & VIP Suites (8 rooms)
    {
      roomNumber: "301",
      name: "Penthouse East",
      type: "PENTHOUSE",
      pricePerNight: 20000,
      capacity: 4,
      floor: 4,
      totalRooms: 1,
      description: "Exclusive penthouse facing Annapurna range with terrace.",
      amenities: [
        "WiFi",
        "AC",
        "Hot Water",
        "Private Terrace",
        "Spa Bath",
        "Mountain View",
        "Minibar",
        "Premium Bedding",
      ],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "302",
      name: "Penthouse West",
      type: "PENTHOUSE",
      pricePerNight: 20000,
      capacity: 4,
      floor: 4,
      totalRooms: 1,
      description: "Exclusive penthouse facing Phewa Lake with full views.",
      amenities: [
        "WiFi",
        "AC",
        "Hot Water",
        "Private Terrace",
        "Spa Bath",
        "Lake View",
        "Minibar",
        "Premium Bedding",
      ],
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "303",
      name: "Royal Suite A",
      type: "SUITE",
      pricePerNight: 15500,
      capacity: 3,
      floor: 4,
      totalRooms: 1,
      description: "Royal suite with living room and panoramic views.",
      amenities: ["WiFi", "AC", "Hot Water", "Living Area", "Mountain View", "Minibar"],
      images: ["https://images.unsplash.com/photo-1591088407891-249cb8f5e9d8?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "304",
      name: "Royal Suite B",
      type: "SUITE",
      pricePerNight: 15500,
      capacity: 3,
      floor: 4,
      totalRooms: 1,
      description: "Royal suite with living room and panoramic views.",
      amenities: ["WiFi", "AC", "Hot Water", "Living Area", "Mountain View", "Minibar"],
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "305",
      name: "Deluxe Corner V1",
      type: "DELUXE",
      pricePerNight: 11800,
      capacity: 2,
      floor: 4,
      totalRooms: 1,
      description: "Deluxe corner room with wraparound views.",
      amenities: ["WiFi", "AC", "Hot Water", "Mountain View", "Lake View", "Terrace"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "306",
      name: "Deluxe Corner V2",
      type: "DELUXE",
      pricePerNight: 11800,
      capacity: 2,
      floor: 4,
      totalRooms: 1,
      description: "Deluxe corner room with wraparound views.",
      amenities: ["WiFi", "AC", "Hot Water", "Mountain View", "Lake View", "Terrace"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "307",
      name: "Executive Single",
      type: "SINGLE",
      pricePerNight: 5800,
      capacity: 1,
      floor: 4,
      totalRooms: 1,
      description: "Executive single room with premium amenities.",
      amenities: ["WiFi", "AC", "Hot Water", "Mountain View", "Work Desk", "Premium Bedding"],
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80"],
    },
    {
      roomNumber: "308",
      name: "Executive Double",
      type: "DOUBLE",
      pricePerNight: 9200,
      capacity: 2,
      floor: 4,
      totalRooms: 1,
      description: "Executive double room with conference setup.",
      amenities: ["WiFi", "AC", "Hot Water", "Mountain View", "Conference Table", "Premium Bedding"],
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80"],
    },
  ];

  for (const room of hotel2Rooms) {
    await prisma.room.create({
      data: {
        hotelId: hotel2.id,
        ...room,
      },
    });
  }

  console.log("✅ 32 rooms created for Hotel 2\n");

  // ────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────────────

  console.log("\n✅ Seeding complete!\n");
  console.log("📋 Demo Credentials:");
  console.log("  Admin:    admin@nepalstay.com              | password: admin123");
  console.log("  Vendor 1: rajesh@urbanboutique.com         | password: password123");
  console.log("  Vendor 2: sita@mountainlodge.com          | password: password123");
  console.log("  Staff 1:  ramesh@urbanboutique.com         | password: password123");
  console.log("  Staff 2:  maya@mountainlodge.com           | password: password123");
  console.log("  Customer: traveler@example.com             | password: password123");
  console.log("  Foreign:  foreign@example.com              | password: password123");
  console.log("\n🏨 Hotels:");
  console.log("  Hotel 1: Urban Kathmandu Boutique (Small - 8 rooms, 2 floors)");
  console.log("  Hotel 2: Pokhara Mountain Lodge (Large - 32 rooms, 4 levels)");
  console.log("\n🛏️  All rooms have unique room numbers and unique names per hotel!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
