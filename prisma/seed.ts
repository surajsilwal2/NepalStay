import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NepalStay database...");

  const hashedPassword = await bcrypt.hash("password123", 12);
  const adminPassword = await bcrypt.hash("admin123", 12);

  // ── Users ─────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@nepalstay.com" },
    update: { password: adminPassword },
    create: {
      name: "Admin User",
      email: "admin@nepalstay.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "+977-9800000001",
    },
  });

  const vendor1 = await prisma.user.upsert({
    where: { email: "vendor1@nepalstay.com" },
    update: { password: hashedPassword },
    create: {
      name: "Raj Shrestha",
      email: "vendor1@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000001",
    },
  });

  const vendor2 = await prisma.user.upsert({
    where: { email: "vendor2@nepalstay.com" },
    update: { password: hashedPassword },
    create: {
      name: "Sita Gurung",
      email: "vendor2@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000002",
    },
  });

  // One hotel per vendor — schema has @@unique on vendorId
  const vendor3 = await prisma.user.upsert({
    where: { email: "vendor3@nepalstay.com" },
    update: { password: hashedPassword },
    create: {
      name: "Binod Thapa",
      email: "vendor3@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000003",
    },
  });

  const vendor4 = await prisma.user.upsert({
    where: { email: "vendor4@nepalstay.com" },
    update: {},
    create: {
      name: "Deepak Rai",
      email: "vendor4@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000004",
    },
  });

  const vendor5 = await prisma.user.upsert({
    where: { email: "vendor5@nepalstay.com" },
    update: {},
    create: {
      name: "Anita Karki",
      email: "vendor5@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000005",
    },
  });

  const vendor6 = await prisma.user.upsert({
    where: { email: "vendor6@nepalstay.com" },
    update: {},
    create: {
      name: "Suresh Magar",
      email: "vendor6@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000006",
    },
  });

  const vendor7 = await prisma.user.upsert({
    where: { email: "vendor7@nepalstay.com" },
    update: {},
    create: {
      name: "Kamala Bista",
      email: "vendor7@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000007",
    },
  });

  const vendor8 = await prisma.user.upsert({
    where: { email: "vendor8@nepalstay.com" },
    update: {},
    create: {
      name: "Prakash Limbu",
      email: "vendor8@nepalstay.com",
      password: hashedPassword,
      role: "VENDOR",
      phone: "+977-9841000008",
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: "staff@nepalstay.com" },
    update: { password: hashedPassword },
    create: {
      name: "Ram Tamang",
      email: "staff@nepalstay.com",
      password: hashedPassword,
      role: "STAFF",
      phone: "+977-9800000003",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@nepalstay.com" },
    update: { password: hashedPassword },
    create: {
      name: "Priya Maharjan",
      email: "customer@nepalstay.com",
      password: hashedPassword,
      role: "CUSTOMER",
      phone: "+977-9800000004",
    },
  });

  // ── Hotel Images (Unsplash — free, no API key needed) ─────────────────────
  const hotel1Images = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c4a49f7e?w=800&q=80",
  ];

  const hotel2Images = [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    "https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800&q=80",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
  ];

  const hotel3Images = [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
    "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&q=80",
  ];

  // ── 5 Additional Hotels ───────────────────────────────────────────────────

  const hotel4Images = [
    "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80",
    "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80",
    "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=800&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
    "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=800&q=80",
  ];

const hotel5Images = [
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c4a49f7e?w=800&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
];

  const hotel6Images = [
    "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1200&q=80",
    "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&q=80",
    "https://images.unsplash.com/photo-1601701119533-fde05e6ee5bc?w=800&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  ];

  const hotel7Images = [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1587088407891-249cb8f5e9d8?w=800&q=80",
    "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&q=80",
  ];

  const hotel8Images = [
    "https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=1200&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=80",
    "https://images.unsplash.com/photo-1467881452275-fc17a1fccf92?w=800&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  ];

  // Hotel 4 — Nagarkot View Resort
  const hotel4 = await prisma.hotel.upsert({
    where: { slug: "nagarkot-sunrise-view-resort" },
    update: { images: hotel4Images },
    create: {
      vendorId: vendor4.id,
      name: "Nagarkot Sunrise View Resort",
      slug: "nagarkot-sunrise-view-resort",
      description:
        "Perched at 2175 metres above sea level, Nagarkot Sunrise View Resort offers the most breathtaking panoramic views of the Himalayan range including Everest on a clear day. Watch the golden sunrise paint the peaks while enjoying authentic Newari cuisine. The perfect mountain retreat just 32 km from Kathmandu.",
      status: "APPROVED",
      city: "Nagarkot",
      address: "Nagarkot Hill, Bhaktapur 44800",
      latitude: 27.7167,
      longitude: 85.5167,
      starRating: 4,
      propertyType: "Resort",
      amenities: [
        "WiFi",
        "Restaurant",
        "Mountain View",
        "Garden",
        "Parking",
        "Fireplace",
      ],
      images: hotel4Images,
      contactPhone: "+977-011-661234",
      contactEmail: "info@nagarkotresort.com",
      policies: {
        checkIn: "13:00",
        checkOut: "11:00",
        cancellation: "Free cancellation up to 72 hours before check-in",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Hotel 5 — Lumbini Peace Hotel
  const hotel5 = await prisma.hotel.upsert({
    where: { slug: "lumbini-peace-garden-hotel" },
    update: { images: hotel5Images },
    create: {
      vendorId: vendor5.id,
      name: "Lumbini Peace Garden Hotel",
      slug: "lumbini-peace-garden-hotel",
      description:
        "Located in the sacred birthplace of Lord Buddha, Lumbini Peace Garden Hotel offers serene accommodation surrounded by monasteries and meditation gardens. A spiritual retreat for pilgrims and travellers from around the world. Walking distance from the Maya Devi Temple and the eternal flame.",
      status: "APPROVED",
      city: "Lumbini",
      address: "Buddha Marg, Lumbini 32914",
      latitude: 27.4833,
      longitude: 83.275,
      starRating: 3,
      propertyType: "Hotel",
      amenities: [
        "WiFi",
        "Restaurant",
        "Garden",
        "Parking",
        "AC",
        "Meditation Hall",
      ],
      images: hotel5Images,
      contactPhone: "+977-071-580456",
      contactEmail: "stay@lumbinipeacehotel.com",
      policies: {
        checkIn: "12:00",
        checkOut: "10:00",
        cancellation: "Full refund up to 48 hours before check-in",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Hotel 6 — Bandipur Hill Guesthouse
  const hotel6 = await prisma.hotel.upsert({
    where: { slug: "bandipur-hill-guesthouse" },
    update: { images: hotel6Images },
    create: {
      vendorId: vendor6.id,
      name: "Bandipur Hill Guesthouse",
      slug: "bandipur-hill-guesthouse",
      description:
        "A charming heritage guesthouse in the perfectly preserved medieval town of Bandipur. Stone-paved streets, Newari architecture, and stunning valley views make this one of Nepal's most atmospheric destinations. Experience the real Nepal away from the tourist crowds. Listed as one of the top hidden gems in Asia.",
      status: "APPROVED",
      city: "Kathmandu",
      address: "Bandipur Bazaar, Tanahun 35100",
      latitude: 27.933,
      longitude: 84.41,
      starRating: 3,
      propertyType: "Guesthouse",
      amenities: ["WiFi", "Restaurant", "Mountain View", "Garden", "Hot Water"],
      images: hotel6Images,
      contactPhone: "+977-065-520789",
      contactEmail: "hello@bandipurguesthouse.com",
      policies: {
        checkIn: "14:00",
        checkOut: "11:00",
        cancellation: "50% refund for cancellations within 48 hours",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Hotel 7 — Pokhara Grand Boutique Hotel
  const hotel7 = await prisma.hotel.upsert({
    where: { slug: "pokhara-grand-boutique-hotel" },
    update: { images: hotel7Images },
    create: {
      vendorId: vendor7.id,
      name: "Pokhara Grand Boutique Hotel",
      slug: "pokhara-grand-boutique-hotel",
      description:
        "A sophisticated boutique hotel in the heart of Pokhara city, just 5 minutes from Phewa Lake. Tastefully designed rooms blend modern comfort with traditional Nepali craftsmanship. Rooftop restaurant with live music on weekends. Ideal base for paragliding, boating, World Peace Pagoda visits, and the Annapurna Circuit trek.",
      status: "APPROVED",
      city: "Pokhara",
      address: "New Road, Pokhara 33700",
      latitude: 28.238,
      longitude: 83.9956,
      starRating: 4,
      propertyType: "Boutique Hotel",
      amenities: [
        "WiFi",
        "Restaurant",
        "Bar",
        "Rooftop",
        "AC",
        "Gym",
        "Mountain View",
      ],
      images: hotel7Images,
      contactPhone: "+977-061-523456",
      contactEmail: "info@pokharaGrand.com",
      policies: {
        checkIn: "14:00",
        checkOut: "12:00",
        cancellation: "Free cancellation up to 24 hours before check-in",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Hotel 8 — Everest Base Camp Lodge
  const hotel8 = await prisma.hotel.upsert({
    where: { slug: "namche-bazaar-everest-lodge" },
    update: { images: hotel8Images },
    create: {
      vendorId: vendor8.id,
      name: "Namche Bazaar Everest Lodge",
      slug: "namche-bazaar-everest-lodge",
      description:
        "A legendary trekkers lodge in Namche Bazaar, the gateway to Everest. Warm yak-wool blankets, hot dal bhat, and stories from fellow adventurers around a wood fire. Acclimatisation walks, yak cheese, and the world's most famous mountain just ahead. The first stop on the Everest Base Camp trek at 3440 metres.",
      status: "APPROVED",
      city: "Kathmandu",
      address: "Namche Bazaar, Solukhumbu 56000",
      latitude: 27.8069,
      longitude: 86.7139,
      starRating: 2,
      propertyType: "Lodge",
      amenities: [
        "WiFi",
        "Restaurant",
        "Hot Water",
        "Mountain View",
        "Fireplace",
      ],
      images: hotel8Images,
      contactPhone: "+977-038-540123",
      contactEmail: "trek@namchelodge.com",
      policies: {
        checkIn: "12:00",
        checkOut: "09:00",
        cancellation: "No refund — remote location, all bookings final",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // ── Rooms for 5 new hotels ────────────────────────────────────────────────
  await prisma.room.createMany({
    skipDuplicates: true,
    data: [
      // Hotel 4 — Nagarkot Sunrise View Resort
      {
        hotelId: hotel4.id,
        name: "Mountain View Room",
        type: "DOUBLE",
        pricePerNight: 4500,
        capacity: 2,
        floor: 2,
        totalRooms: 8,
        description:
          "Wake up to panoramic Himalayan views from your private balcony. On clear days you can see Mount Everest.",
        amenities: ["WiFi", "Hot Water", "Balcony", "Mountain View", "Heater"],
        images: [
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
        ],
      },
      {
        hotelId: hotel4.id,
        name: "Sunrise Deluxe",
        type: "DELUXE",
        pricePerNight: 7500,
        capacity: 2,
        floor: 3,
        totalRooms: 4,
        description:
          "Premium east-facing room positioned perfectly for Himalayan sunrise views. Includes telescope for stargazing.",
        amenities: [
          "WiFi",
          "Hot Water",
          "Balcony",
          "Mountain View",
          "Heater",
          "Telescope",
        ],
        images: [
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
        ],
      },
      {
        hotelId: hotel4.id,
        name: "Family Cottage",
        type: "TWIN",
        pricePerNight: 6000,
        capacity: 4,
        floor: 1,
        totalRooms: 3,
        description:
          "Cozy standalone cottage with two bedrooms, perfect for families exploring the mountain area.",
        amenities: ["WiFi", "Hot Water", "Garden View", "Heater", "Fireplace"],
        images: [
          "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
        ],
      },

      // Hotel 5 — Lumbini Peace Garden Hotel
      {
        hotelId: hotel5.id,
        name: "Pilgrim Standard Room",
        type: "SINGLE",
        pricePerNight: 2200,
        capacity: 2,
        floor: 1,
        totalRooms: 12,
        description:
          "Simple, clean room perfect for pilgrims. Quiet atmosphere conducive to meditation and reflection.",
        amenities: ["WiFi", "AC", "Hot Water", "Garden View"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
        ],
      },
      {
        hotelId: hotel5.id,
        name: "Monastery View Suite",
        type: "SUITE",
        pricePerNight: 5500,
        capacity: 3,
        floor: 2,
        totalRooms: 3,
        description:
          "Spacious suite overlooking the sacred garden and monasteries. Private meditation balcony included.",
        amenities: [
          "WiFi",
          "AC",
          "Hot Water",
          "Garden View",
          "Balcony",
          "Minibar",
        ],
        images: [
          "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
        ],
      },
      {
        hotelId: hotel5.id,
        name: "Dormitory",
        type: "DORMITORY",
        pricePerNight: 600,
        capacity: 1,
        floor: 1,
        totalRooms: 20,
        description:
          "Affordable dormitory for budget pilgrims and backpackers. Clean, safe, with 24-hour security.",
        amenities: ["WiFi", "Hot Water", "Locker", "Fan"],
        images: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
        ],
      },

      // Hotel 6 — Bandipur Hill Guesthouse
      {
        hotelId: hotel6.id,
        name: "Heritage Room",
        type: "DOUBLE",
        pricePerNight: 3200,
        capacity: 2,
        floor: 1,
        totalRooms: 6,
        description:
          "Traditional Newari-style room with wooden carvings and antique furnishings. Valley views from every window.",
        amenities: ["WiFi", "Hot Water", "Mountain View", "Heater"],
        images: [
          "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
        ],
      },
      {
        hotelId: hotel6.id,
        name: "Panorama Suite",
        type: "SUITE",
        pricePerNight: 6800,
        capacity: 3,
        floor: 2,
        totalRooms: 2,
        description:
          "Top-floor suite with 270-degree valley and mountain views. Hand-crafted furniture by local Newari artisans.",
        amenities: [
          "WiFi",
          "Hot Water",
          "Mountain View",
          "Heater",
          "Bathtub",
          "Balcony",
        ],
        images: [
          "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
        ],
      },

      // Hotel 7 — Pokhara Grand Boutique Hotel
      {
        hotelId: hotel7.id,
        name: "City View Room",
        type: "SINGLE",
        pricePerNight: 4200,
        capacity: 2,
        floor: 2,
        totalRooms: 10,
        description:
          "Modern room with Pokhara city views. Walking distance from Phewa Lake, restaurants, and adventure sports operators.",
        amenities: ["WiFi", "AC", "TV", "Hot Water", "City View"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
        ],
      },
      {
        hotelId: hotel7.id,
        name: "Annapurna Deluxe",
        type: "DELUXE",
        pricePerNight: 8500,
        capacity: 2,
        floor: 4,
        totalRooms: 5,
        description:
          "Premium room with direct Annapurna range views. High floor guarantees unobstructed mountain panorama.",
        amenities: [
          "WiFi",
          "AC",
          "TV",
          "Hot Water",
          "Mountain View",
          "Minibar",
          "Balcony",
        ],
        images: [
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
        ],
      },
      {
        hotelId: hotel7.id,
        name: "Rooftop Penthouse",
        type: "PENTHOUSE",
        pricePerNight: 18000,
        capacity: 4,
        floor: 6,
        totalRooms: 1,
        description:
          "Exclusive penthouse with private rooftop terrace, hot tub, and 360-degree views of Pokhara and the Himalayas.",
        amenities: [
          "WiFi",
          "AC",
          "TV",
          "Hot Water",
          "Mountain View",
          "Hot Tub",
          "Balcony",
          "Minibar",
          "Butler Service",
        ],
        images: [
          "https://images.unsplash.com/photo-1587088407891-249cb8f5e9d8?w=800&q=80",
        ],
      },

      // Hotel 8 — Namche Bazaar Everest Lodge
      {
        hotelId: hotel8.id,
        name: "Trekkers Room",
        type: "SINGLE",
        pricePerNight: 1800,
        capacity: 2,
        floor: 1,
        totalRooms: 15,
        description:
          "No-frills but cozy room built for trekkers. Thick blankets, hot water bottle on request, and early breakfast available from 5am for summit push days.",
        amenities: ["Hot Water", "Heater", "Mountain View"],
        images: [
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        ],
      },
      {
        hotelId: hotel8.id,
        name: "Sherpa Family Suite",
        type: "SUITE",
        pricePerNight: 4500,
        capacity: 4,
        floor: 2,
        totalRooms: 3,
        description:
          "Spacious suite built by a Sherpa family with traditional Tibetan decor. Everest and Lhotse visible on clear mornings.",
        amenities: [
          "WiFi",
          "Hot Water",
          "Heater",
          "Mountain View",
          "Fireplace",
        ],
        images: [
          "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&q=80",
        ],
      },
      {
        hotelId: hotel8.id,
        name: "Dormitory Bunk",
        type: "DORMITORY",
        pricePerNight: 500,
        capacity: 1,
        floor: 1,
        totalRooms: 20,
        description:
          "Classic trekkers dormitory at Everest Base Camp trail. Meet fellow adventurers from all over the world.",
        amenities: ["Hot Water", "Locker", "Heater"],
        images: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
        ],
      },
    ],
  });

  // ── Hotels ────────────────────────────────────────────────────────────────
  const hotel1 = await prisma.hotel.upsert({
    where: { slug: "himalayan-heritage-hotel-kathmandu" },
    update: { images: hotel1Images },
    create: {
      vendorId: vendor1.id,
      name: "Himalayan Heritage Hotel",
      slug: "himalayan-heritage-hotel-kathmandu",
      description:
        "A luxury heritage hotel in the heart of Thamel, Kathmandu. Experience authentic Nepali hospitality with stunning views of the Himalayan range. Steps away from Pashupatinath Temple and Boudhanath Stupa.",
      status: "APPROVED",
      city: "Kathmandu",
      address: "Thamel, Kathmandu 44600",
      latitude: 27.7172,
      longitude: 85.324,
      starRating: 4,
      propertyType: "Hotel",
      amenities: [
        "WiFi",
        "Parking",
        "Restaurant",
        "Bar",
        "Gym",
        "Mountain View",
      ],
      images: hotel1Images,
      contactPhone: "+977-01-4701234",
      contactEmail: "info@himalayanheritage.com",
      policies: {
        checkIn: "14:00",
        checkOut: "11:00",
        cancellation: "Free cancellation up to 48 hours before check-in",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  const hotel2 = await prisma.hotel.upsert({
    where: { slug: "lakeside-serenity-resort-pokhara" },
    update: { images: hotel2Images },
    create: {
      vendorId: vendor2.id,
      name: "Lakeside Serenity Resort",
      slug: "lakeside-serenity-resort-pokhara",
      description:
        "Nestled on the banks of Phewa Lake in Pokhara, this boutique resort offers breathtaking views of the Annapurna range. Perfect for trekkers, paragliders, and nature lovers seeking tranquil accommodation.",
      status: "APPROVED",
      city: "Pokhara",
      address: "Lakeside, Pokhara 33700",
      latitude: 28.2096,
      longitude: 83.9856,
      starRating: 4,
      propertyType: "Resort",
      amenities: [
        "WiFi",
        "Restaurant",
        "Pool",
        "Garden",
        "Mountain View",
        "Spa",
      ],
      images: hotel2Images,
      contactPhone: "+977-061-465432",
      contactEmail: "stay@lakesideserenity.com",
      policies: {
        checkIn: "13:00",
        checkOut: "12:00",
        cancellation: "50% refund for cancellations 3-7 days before check-in",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  const hotel3 = await prisma.hotel.upsert({
    where: { slug: "chitwan-jungle-lodge" },
    update: { images: hotel3Images },
    create: {
      vendorId: vendor3.id,
      name: "Chitwan Jungle Lodge",
      slug: "chitwan-jungle-lodge",
      description:
        "An eco-friendly lodge at the edge of Chitwan National Park. Experience wildlife safaris, elephant walks, and canoe rides along the Rapti River. A nature lover's paradise with authentic Tharu cultural programmes.",
      status: "APPROVED",
      city: "Chitwan",
      address: "Sauraha, Chitwan 44200",
      latitude: 27.5799,
      longitude: 84.4985,
      starRating: 3,
      propertyType: "Lodge",
      amenities: ["WiFi", "Restaurant", "Parking", "Garden"],
      images: hotel3Images,
      contactPhone: "+977-056-580123",
      contactEmail: "info@chitwanjunglelodge.com",
      policies: {
        checkIn: "12:00",
        checkOut: "10:00",
        cancellation: "Full refund up to 7 days before check-in",
      },
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Assign staff to hotel1
  await prisma.user.update({
    where: { id: staff1.id },
    data: { staffHotelId: hotel1.id },
  });

  // ── Rooms ─────────────────────────────────────────────────────────────────
  await prisma.room.createMany({
    skipDuplicates: true,
    data: [
      // Hotel 1 — Himalayan Heritage, Kathmandu
      {
        hotelId: hotel1.id,
        name: "Standard Room",
        type: "SINGLE",
        pricePerNight: 3500,
        capacity: 2,
        floor: 1,
        totalRooms: 5,
        description:
          "Comfortable standard room with city view, en-suite bathroom, and complimentary breakfast.",
        amenities: ["WiFi", "AC", "TV", "Hot Water"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
        ],
      },
      {
        hotelId: hotel1.id,
        name: "Deluxe Mountain View",
        type: "DOUBLE",
        pricePerNight: 6500,
        capacity: 2,
        floor: 3,
        totalRooms: 4,
        description:
          "Spacious deluxe room with panoramic Himalayan views, king bed, and premium amenities.",
        amenities: [
          "WiFi",
          "AC",
          "TV",
          "Hot Water",
          "Minibar",
          "Mountain View",
        ],
        images: [
          "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
        ],
      },
      {
        hotelId: hotel1.id,
        name: "Executive Suite",
        type: "SUITE",
        pricePerNight: 12000,
        capacity: 4,
        floor: 5,
        totalRooms: 2,
        description:
          "Luxurious suite with separate living area, private balcony, and butler service.",
        amenities: [
          "WiFi",
          "AC",
          "TV",
          "Hot Water",
          "Minibar",
          "Bathtub",
          "Mountain View",
        ],
        images: [
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
        ],
      },

      // Hotel 2 — Lakeside Serenity, Pokhara
      {
        hotelId: hotel2.id,
        name: "Lake View Room",
        type: "DOUBLE",
        pricePerNight: 5500,
        capacity: 2,
        floor: 1,
        totalRooms: 6,
        description:
          "Elegant room with direct views of Phewa Lake and Annapurna range. Private balcony included.",
        amenities: ["WiFi", "AC", "Hot Water", "Balcony", "Mountain View"],
        images: [
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
        ],
      },
      {
        hotelId: hotel2.id,
        name: "Garden Cottage",
        type: "DOUBLE",
        pricePerNight: 4200,
        capacity: 3,
        floor: 1,
        totalRooms: 4,
        description:
          "Charming standalone cottage surrounded by tropical garden. Perfect for families.",
        amenities: ["WiFi", "AC", "Hot Water", "Garden View"],
        images: [
          "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
        ],
      },
      {
        hotelId: hotel2.id,
        name: "Honeymoon Suite",
        type: "SUITE",
        pricePerNight: 9500,
        capacity: 2,
        floor: 2,
        totalRooms: 2,
        description:
          "Romantic suite with jacuzzi, rose petal setup, and private rooftop deck overlooking the lake.",
        amenities: [
          "WiFi",
          "AC",
          "Hot Water",
          "Jacuzzi",
          "Lake View",
          "Minibar",
        ],
        images: [
          "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
        ],
      },

      // Hotel 3 — Chitwan Jungle Lodge
      {
        hotelId: hotel3.id,
        name: "Jungle Deluxe Room",
        type: "DOUBLE",
        pricePerNight: 3800,
        capacity: 2,
        floor: 1,
        totalRooms: 8,
        description:
          "Comfortable room with jungle views. Wake up to bird calls and elephant sightings.",
        amenities: ["WiFi", "Hot Water", "Fan", "Mosquito Net"],
        images: [
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        ],
      },
      {
        hotelId: hotel3.id,
        name: "Dormitory Bed",
        type: "DORMITORY",
        pricePerNight: 800,
        capacity: 1,
        floor: 1,
        totalRooms: 10,
        description:
          "Budget-friendly dormitory for backpackers and solo travellers.",
        amenities: ["WiFi", "Hot Water", "Locker"],
        images: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
        ],
      },
    ],
  });

  console.log("\n✅ Seeding complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("  Admin:    admin@nepalstay.com    / admin123");
  console.log(
    "  Vendor 1: vendor1@nepalstay.com  / password123  → Himalayan Heritage, Kathmandu",
  );
  console.log(
    "  Vendor 2: vendor2@nepalstay.com  / password123  → Lakeside Serenity, Pokhara",
  );
  console.log(
    "  Vendor 3: vendor3@nepalstay.com  / password123  → Chitwan Jungle Lodge",
  );
  console.log("  Staff:    staff@nepalstay.com    / password123");
  console.log("  Customer: customer@nepalstay.com / password123");
  console.log(
    "\n🖼️  Images from Unsplash — internet connection required to display them",
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
