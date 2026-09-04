import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as drizzleSql } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import { mockEncrypt, maskCCCD } from "../src/lib/mock/kms";

async function seed() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NETLIFY_DATABASE_URL;
  if (!connectionString) {
    console.error("Error: DATABASE_URL, NEON_DATABASE_URL, or POSTGRES_URL environment variable is required to run seed.");
    process.exit(1);
  }

  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });


  console.log("🚀 Starting comprehensive enterprise database seed (40 Real Cars Mapping)...");

  console.log("🧹 Cleaning up existing data...");
  await db.execute(drizzleSql`TRUNCATE TABLE audit_logs, outbox_events, credit_transactions, customer_credit_accounts, vin_hold_reservations, refund_requests, vehicle_transfers, loan_applications, payments, order_status_history, order_accessories, orders, trade_in_requests, test_drive_slots, crm_leads, discount_policies, vehicles, vehicle_quotas, vehicle_images, vehicle_variants, vehicle_models, brands, customer_profiles, users, showrooms CASCADE;`);

  // 1. Showrooms
  console.log("📍 Seeding showrooms...");
  const [srHN, srHCM, srDN, srVinh] = await db
    .insert(schema.showrooms)
    .values([
      { name: "Showroom Cầu Giấy - Hà Nội", code: "SR-HN-CG", address: "Số 88 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội", phone: "024-3833-0001" },
      { name: "Showroom Quận 7 - TP.HCM", code: "SR-HCM-Q7", address: "Số 200 Nguyễn Thị Thập, Tân Phú, Quận 7, TP.HCM", phone: "028-3773-0002" },
      { name: "Showroom Hải Châu - Đà Nẵng", code: "SR-DN-HC", address: "Số 50 Nguyễn Văn Linh, Nam Dương, Hải Châu, Đà Nẵng", phone: "023-6382-0003" },
      { name: "Showroom TP. Vinh - Nghệ An", code: "SR-NA-VINH", address: "Số 120 Nguyễn Trãi, Hà Huy Tập, TP. Vinh, Nghệ An", phone: "023-8399-0004" },
    ])
    .returning();

  // 2. Users (Admin, Managers, Sales, Customers)
  console.log("👥 Seeding users across system roles...");
  const defaultPasswordHash = hashSync("Admin@123", 10);
  const [admin, managerHN, managerHCM, sale1, sale2, sale3, sale4, customer1, customer2, customer3, customer4] = await db
    .insert(schema.users)
    .values([
      { email: "admin@autodealer.vn", phone: "0900000001", passwordHash: defaultPasswordHash, fullName: "Nguyễn Văn Admin", role: "ADMIN" as const, showroomId: srHN.id },
      { email: "manager.hn@autodealer.vn", phone: "0900000002", passwordHash: defaultPasswordHash, fullName: "Trần Thị Manager HN", role: "MANAGER" as const, showroomId: srHN.id },
      { email: "manager.hcm@autodealer.vn", phone: "0900000003", passwordHash: defaultPasswordHash, fullName: "Lê Văn Manager HCM", role: "MANAGER" as const, showroomId: srHCM.id },
      { email: "sale1@autodealer.vn", phone: "0900000004", passwordHash: defaultPasswordHash, fullName: "Phạm Văn Sale HN 1", role: "SALE" as const, showroomId: srHN.id },
      { email: "sale2@autodealer.vn", phone: "0900000005", passwordHash: defaultPasswordHash, fullName: "Hoàng Thị Sale HN 2", role: "SALE" as const, showroomId: srHN.id },
      { email: "sale3@autodealer.vn", phone: "0900000006", passwordHash: defaultPasswordHash, fullName: "Vũ Văn Sale HCM", role: "SALE" as const, showroomId: srHCM.id },
      { email: "sale4@autodealer.vn", phone: "0900000007", passwordHash: defaultPasswordHash, fullName: "Đặng Thị Sale ĐN", role: "SALE" as const, showroomId: srDN.id },
      { email: "customer1@gmail.com", phone: "0912345678", passwordHash: defaultPasswordHash, fullName: "Nguyễn Văn Tuấn", role: "CUSTOMER" as const },
      { email: "customer2@gmail.com", phone: "0988776655", passwordHash: defaultPasswordHash, fullName: "Trần Thị Minh Hương", role: "CUSTOMER" as const },
      { email: "customer3@gmail.com", phone: "0934567890", passwordHash: defaultPasswordHash, fullName: "Lê Hoàng Nam", role: "CUSTOMER" as const },
      { email: "customer4@gmail.com", phone: "0977112233", passwordHash: defaultPasswordHash, fullName: "Phạm Quốc Bảo", role: "CUSTOMER" as const },
    ])
    .returning();

  // 3. Customer Profiles (KMS Encrypted CCCD PII)
  console.log("🔒 Seeding customer profiles...");
  await db.insert(schema.customerProfiles).values([
    {
      userId: customer1.id,
      identityCardNumber: mockEncrypt("001200001234"),
      identityCardMasked: maskCCCD("001200001234"),
      identityCardDate: "2021-08-15",
      identityCardPlace: "Cục CSQLHC về TTXH",
      permanentAddress: "Số 12 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
      monthlyIncome: "35000000",
    },
    {
      userId: customer2.id,
      identityCardNumber: mockEncrypt("079200005678"),
      identityCardMasked: maskCCCD("079200005678"),
      identityCardDate: "2022-03-20",
      identityCardPlace: "Công an TP.HCM",
      permanentAddress: "Số 100 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM",
      monthlyIncome: "45000000",
    },
    {
      userId: customer3.id,
      identityCardNumber: mockEncrypt("048200009988"),
      identityCardMasked: maskCCCD("048200009988"),
      identityCardDate: "2020-11-10",
      identityCardPlace: "Công an TP. Đà Nẵng",
      permanentAddress: "Số 45 Nguyễn Văn Linh, Hải Châu, Đà Nẵng",
      monthlyIncome: "28000000",
    },
    {
      userId: customer4.id,
      identityCardNumber: mockEncrypt("040200007766"),
      identityCardMasked: maskCCCD("040200007766"),
      identityCardDate: "2023-01-05",
      identityCardPlace: "Công an Tỉnh Nghệ An",
      permanentAddress: "Số 88 Lê Lợi, TP. Vinh, Nghệ An",
      monthlyIncome: "50000000",
    },
  ]);

  // 4. Brands (11 Major Automobile Manufacturers in Vietnam)
  console.log("🚘 Seeding 11 vehicle brands...");
  const [toyota, ford, honda, vinfast, hyundai, kia, mazda, benz, bmw, lexus, mitsubishi] = await db
    .insert(schema.brands)
    .values([
      { name: "Toyota", logoUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80" },
      { name: "Ford", logoUrl: "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=400&q=80" },
      { name: "Honda", logoUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80" },
      { name: "VinFast", logoUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80" },
      { name: "Hyundai", logoUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80" },
      { name: "Kia", logoUrl: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=400&q=80" },
      { name: "Mazda", logoUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80" },
      { name: "Mercedes-Benz", logoUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80" },
      { name: "BMW", logoUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80" },
      { name: "Lexus", logoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80" },
      { name: "Mitsubishi", logoUrl: "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=400&q=80" },
    ])
    .returning();

  // 5. 40 Real Vehicle Models
  console.log("🚗 Seeding 40 real vehicle models...");
  const rawModels = [
    // Toyota (6)
    { brandId: toyota.id, name: "Veloz Cross", bodyType: "MPV" },
    { brandId: toyota.id, name: "Vios", bodyType: "Sedan" },
    { brandId: toyota.id, name: "Camry", bodyType: "Sedan" },
    { brandId: toyota.id, name: "Corolla Cross", bodyType: "CUV" },
    { brandId: toyota.id, name: "Fortuner", bodyType: "SUV" },
    { brandId: toyota.id, name: "Raize", bodyType: "CUV" },

    // Ford (4)
    { brandId: ford.id, name: "Ranger", bodyType: "Pickup" },
    { brandId: ford.id, name: "Everest", bodyType: "SUV" },
    { brandId: ford.id, name: "Territory", bodyType: "CUV" },
    { brandId: ford.id, name: "Explorer", bodyType: "SUV" },

    // Honda (4)
    { brandId: honda.id, name: "City", bodyType: "Sedan" },
    { brandId: honda.id, name: "CR-V", bodyType: "SUV" },
    { brandId: honda.id, name: "Civic", bodyType: "Sedan" },
    { brandId: honda.id, name: "HR-V", bodyType: "CUV" },

    // VinFast (5)
    { brandId: vinfast.id, name: "VF5", bodyType: "Hatchback" },
    { brandId: vinfast.id, name: "VF6", bodyType: "CUV" },
    { brandId: vinfast.id, name: "VF7", bodyType: "SUV" },
    { brandId: vinfast.id, name: "VF8", bodyType: "SUV" },
    { brandId: vinfast.id, name: "VF9", bodyType: "SUV" },

    // Hyundai (5)
    { brandId: hyundai.id, name: "Accent", bodyType: "Sedan" },
    { brandId: hyundai.id, name: "Creta", bodyType: "CUV" },
    { brandId: hyundai.id, name: "Tucson", bodyType: "SUV" },
    { brandId: hyundai.id, name: "Santa Fe", bodyType: "SUV" },
    { brandId: hyundai.id, name: "Stargazer", bodyType: "MPV" },

    // Kia (5)
    { brandId: kia.id, name: "Morning", bodyType: "Hatchback" },
    { brandId: kia.id, name: "Seltos", bodyType: "CUV" },
    { brandId: kia.id, name: "Carnival", bodyType: "MPV" },
    { brandId: kia.id, name: "K5", bodyType: "Sedan" },
    { brandId: kia.id, name: "Sportage", bodyType: "SUV" },

    // Mazda (3)
    { brandId: mazda.id, name: "Mazda3", bodyType: "Sedan" },
    { brandId: mazda.id, name: "CX-5", bodyType: "CUV" },
    { brandId: mazda.id, name: "CX-8", bodyType: "SUV" },

    // Mercedes-Benz (3)
    { brandId: benz.id, name: "C 200", bodyType: "Sedan" },
    { brandId: benz.id, name: "GLC 300", bodyType: "SUV" },
    { brandId: benz.id, name: "S 450", bodyType: "Sedan" },

    // BMW (2)
    { brandId: bmw.id, name: "320i", bodyType: "Sedan" },
    { brandId: bmw.id, name: "X5", bodyType: "SUV" },

    // Lexus (2)
    { brandId: lexus.id, name: "RX 350", bodyType: "SUV" },
    { brandId: lexus.id, name: "ES 250", bodyType: "Sedan" },

    // Mitsubishi (1)
    { brandId: mitsubishi.id, name: "Xpander", bodyType: "MPV" },
  ];

  const models = await db.insert(schema.vehicleModels).values(rawModels).returning();

  // Helper map model index by name
  const getModel = (name: string) => models.find((m) => m.name === name)!;

  // 6. 40 Real Vehicle Variants with exact Market Prices in Vietnam
  console.log("⚡ Seeding 40 real vehicle variants with exact prices...");
  const rawVariants = [
    // 1. Toyota Veloz Cross
    {
      modelId: getModel("Veloz Cross").id, variantName: "Veloz Cross CVT Top", listedPrice: "698000000", minDepositAmount: "30000000",
      specsJson: { engine: "1.5L Dual VVT-i", power: "105 hp", torque: "138 Nm", transmission: "CVT", fuel: "Xăng", seats: 7, fuelConsumption: "6.3L/100km" },
    },
    // 2. Toyota Vios
    {
      modelId: getModel("Vios").id, variantName: "Vios 1.5G CVT", listedPrice: "592000000", minDepositAmount: "20000000",
      specsJson: { engine: "1.5L Dual VVT-i", power: "107 hp", torque: "140 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "5.8L/100km" },
    },
    // 3. Toyota Camry
    {
      modelId: getModel("Camry").id, variantName: "Camry 2.0Q Premium", listedPrice: "1105000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.0L Dynamic Force", power: "170 hp", torque: "205 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.1L/100km" },
    },
    // 4. Toyota Corolla Cross
    {
      modelId: getModel("Corolla Cross").id, variantName: "Corolla Cross 1.8V", listedPrice: "820000000", minDepositAmount: "50000000",
      specsJson: { engine: "1.8L VVT-i", power: "140 hp", torque: "177 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.8L/100km" },
    },
    // 5. Toyota Fortuner
    {
      modelId: getModel("Fortuner").id, variantName: "Fortuner 2.8 Legender 4x4", listedPrice: "1350000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.8L Diesel Turbo", power: "201 hp", torque: "500 Nm", transmission: "6AT", fuel: "Diesel", seats: 7, fuelConsumption: "8.2L/100km" },
    },
    // 6. Toyota Raize
    {
      modelId: getModel("Raize").id, variantName: "Raize 1.0 Turbo CVT", listedPrice: "552000000", minDepositAmount: "20000000",
      specsJson: { engine: "1.0L Turbo", power: "98 hp", torque: "140 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "5.6L/100km" },
    },
    // 7. Ford Ranger
    {
      modelId: getModel("Ranger").id, variantName: "Ranger Wildtrak 4x4", listedPrice: "979000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.0L Bi-Turbo Diesel", power: "210 hp", torque: "500 Nm", transmission: "10AT", fuel: "Diesel", seats: 5, fuelConsumption: "8.5L/100km" },
    },
    // 8. Ford Everest
    {
      modelId: getModel("Everest").id, variantName: "Everest Titanium+ 4WD", listedPrice: "1499000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.0L Bi-Turbo Diesel", power: "210 hp", torque: "500 Nm", transmission: "10AT", fuel: "Diesel", seats: 7, fuelConsumption: "8.0L/100km" },
    },
    // 9. Ford Territory
    {
      modelId: getModel("Territory").id, variantName: "Territory Titanium X", listedPrice: "929000000", minDepositAmount: "50000000",
      specsJson: { engine: "1.5L EcoBoost", power: "160 hp", torque: "248 Nm", transmission: "7DCT", fuel: "Xăng", seats: 5, fuelConsumption: "7.0L/100km" },
    },
    // 10. Ford Explorer
    {
      modelId: getModel("Explorer").id, variantName: "Explorer 2.3 EcoBoost 4WD", listedPrice: "2399000000", minDepositAmount: "100000000",
      specsJson: { engine: "2.3L EcoBoost", power: "301 hp", torque: "432 Nm", transmission: "10AT", fuel: "Xăng", seats: 7, fuelConsumption: "9.5L/100km" },
    },
    // 11. Honda City
    {
      modelId: getModel("City").id, variantName: "City RS 1.5 i-VTEC", listedPrice: "609000000", minDepositAmount: "30000000",
      specsJson: { engine: "1.5L i-VTEC", power: "119 hp", torque: "145 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "5.6L/100km" },
    },
    // 12. Honda CR-V
    {
      modelId: getModel("CR-V").id, variantName: "CR-V L 1.5 Turbo", listedPrice: "1109000000", minDepositAmount: "50000000",
      specsJson: { engine: "1.5L VTEC Turbo", power: "188 hp", torque: "240 Nm", transmission: "CVT", fuel: "Xăng", seats: 7, fuelConsumption: "7.3L/100km" },
    },
    // 13. Honda Civic
    {
      modelId: getModel("Civic").id, variantName: "Civic RS 1.5 Turbo", listedPrice: "870000000", minDepositAmount: "50000000",
      specsJson: { engine: "1.5L VTEC Turbo", power: "176 hp", torque: "240 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.5L/100km" },
    },
    // 14. Honda HR-V
    {
      modelId: getModel("HR-V").id, variantName: "HR-V RS 1.5 Turbo", listedPrice: "871000000", minDepositAmount: "50000000",
      specsJson: { engine: "1.5L VTEC Turbo", power: "174 hp", torque: "240 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.7L/100km" },
    },
    // 15. VinFast VF5
    {
      modelId: getModel("VF5").id, variantName: "VF5 Plus Electric City", listedPrice: "468000000", minDepositAmount: "20000000",
      specsJson: { engine: "Single Electric Motor", power: "134 hp", torque: "135 Nm", transmission: "Single Speed", fuel: "Điện", seats: 5, fuelConsumption: "300 km / lần sạc" },
    },
    // 16. VinFast VF6
    {
      modelId: getModel("VF6").id, variantName: "VF6 Plus Electric CUV", listedPrice: "765000000", minDepositAmount: "30000000",
      specsJson: { engine: "Single Electric Motor", power: "201 hp", torque: "310 Nm", transmission: "Single Speed", fuel: "Điện", seats: 5, fuelConsumption: "381 km / lần sạc" },
    },
    // 17. VinFast VF7
    {
      modelId: getModel("VF7").id, variantName: "VF7 Plus Electric AWD", listedPrice: "999000000", minDepositAmount: "50000000",
      specsJson: { engine: "Dual Electric Motor AWD", power: "349 hp", torque: "500 Nm", transmission: "Single Speed", fuel: "Điện", seats: 5, fuelConsumption: "431 km / lần sạc" },
    },
    // 18. VinFast VF8
    {
      modelId: getModel("VF8").id, variantName: "VF8 Plus Electric Dual-Motor", listedPrice: "1270000000", minDepositAmount: "50000000",
      specsJson: { engine: "Dual Electric Motor AWD", power: "402 hp", torque: "620 Nm", transmission: "Single Speed", fuel: "Điện", seats: 5, fuelConsumption: "471 km / lần sạc" },
    },
    // 19. VinFast VF9
    {
      modelId: getModel("VF9").id, variantName: "VF9 Plus 6-Seater Luxury", listedPrice: "2170000000", minDepositAmount: "100000000",
      specsJson: { engine: "Dual Electric Motor AWD", power: "402 hp", torque: "620 Nm", transmission: "Single Speed", fuel: "Điện", seats: 6, fuelConsumption: "602 km / lần sạc" },
    },
    // 20. Hyundai Accent
    {
      modelId: getModel("Accent").id, variantName: "Accent 1.5 AT Premium", listedPrice: "569000000", minDepositAmount: "20000000",
      specsJson: { engine: "1.5L Smartstream", power: "115 hp", torque: "144 Nm", transmission: "iVT", fuel: "Xăng", seats: 5, fuelConsumption: "5.7L/100km" },
    },
    // 21. Hyundai Creta
    {
      modelId: getModel("Creta").id, variantName: "Creta 1.5 Cao Cấp", listedPrice: "699000000", minDepositAmount: "30000000",
      specsJson: { engine: "1.5L Smartstream", power: "115 hp", torque: "144 Nm", transmission: "iVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.3L/100km" },
    },
    // 22. Hyundai Tucson
    {
      modelId: getModel("Tucson").id, variantName: "Tucson 1.6 Turbo AWD", listedPrice: "1050000000", minDepositAmount: "50000000",
      specsJson: { engine: "1.6L T-GDi", power: "180 hp", torque: "265 Nm", transmission: "7DCT", fuel: "Xăng", seats: 5, fuelConsumption: "7.2L/100km" },
    },
    // 23. Hyundai Santa Fe
    {
      modelId: getModel("Santa Fe").id, variantName: "Santa Fe Calligraphy 2.5T", listedPrice: "1365000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.5L Turbo Smartstream", power: "281 hp", torque: "422 Nm", transmission: "8DCT", fuel: "Xăng", seats: 7, fuelConsumption: "9.0L/100km" },
    },
    // 24. Hyundai Stargazer
    {
      modelId: getModel("Stargazer").id, variantName: "Stargazer X Cao Cấp 7S", listedPrice: "599000000", minDepositAmount: "30000000",
      specsJson: { engine: "1.5L Smartstream", power: "115 hp", torque: "144 Nm", transmission: "iVT", fuel: "Xăng", seats: 7, fuelConsumption: "6.1L/100km" },
    },
    // 25. Kia Morning
    {
      modelId: getModel("Morning").id, variantName: "Morning GT-Line 1.25 AT", listedPrice: "439000000", minDepositAmount: "20000000",
      specsJson: { engine: "1.25L Kappa", power: "83 hp", torque: "122 Nm", transmission: "4AT", fuel: "Xăng", seats: 5, fuelConsumption: "5.4L/100km" },
    },
    // 26. Kia Seltos
    {
      modelId: getModel("Seltos").id, variantName: "Seltos 1.5 Turbo GT-Line", listedPrice: "799000000", minDepositAmount: "30000000",
      specsJson: { engine: "1.5L Turbo Smartstream", power: "158 hp", torque: "253 Nm", transmission: "7DCT", fuel: "Xăng", seats: 5, fuelConsumption: "6.5L/100km" },
    },
    // 27. Kia Carnival
    {
      modelId: getModel("Carnival").id, variantName: "Carnival Signature 3.5G 7S", listedPrice: "1759000000", minDepositAmount: "80000000",
      specsJson: { engine: "3.5L Smartstream V6", power: "268 hp", torque: "331 Nm", transmission: "8AT", fuel: "Xăng", seats: 7, fuelConsumption: "9.5L/100km" },
    },
    // 28. Kia K5
    {
      modelId: getModel("K5").id, variantName: "K5 2.5 GT-Line", listedPrice: "999000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.5L GDI", power: "191 hp", torque: "246 Nm", transmission: "8AT", fuel: "Xăng", seats: 5, fuelConsumption: "7.5L/100km" },
    },
    // 29. Kia Sportage
    {
      modelId: getModel("Sportage").id, variantName: "Sportage 2.0D Signature AWD", listedPrice: "1019000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.0L Diesel Smartstream", power: "183 hp", torque: "416 Nm", transmission: "8AT", fuel: "Diesel", seats: 5, fuelConsumption: "6.8L/100km" },
    },
    // 30. Mazda3
    {
      modelId: getModel("Mazda3").id, variantName: "Mazda3 1.5 Premium", listedPrice: "739000000", minDepositAmount: "30000000",
      specsJson: { engine: "1.5L SkyActiv-G", power: "110 hp", torque: "146 Nm", transmission: "6AT", fuel: "Xăng", seats: 5, fuelConsumption: "5.9L/100km" },
    },
    // 31. Mazda CX-5
    {
      modelId: getModel("CX-5").id, variantName: "CX-5 2.5 AWD Exclusive", listedPrice: "979000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.5L SkyActiv-G", power: "188 hp", torque: "252 Nm", transmission: "6AT", fuel: "Xăng", seats: 5, fuelConsumption: "7.3L/100km" },
    },
    // 32. Mazda CX-8
    {
      modelId: getModel("CX-8").id, variantName: "CX-8 Premium AWD 6S", listedPrice: "1129000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.5L SkyActiv-G", power: "188 hp", torque: "252 Nm", transmission: "6AT", fuel: "Xăng", seats: 6, fuelConsumption: "7.8L/100km" },
    },
    // 33. Mercedes-Benz C 200
    {
      modelId: getModel("C 200").id, variantName: "C 200 Avantgarde Plus", listedPrice: "1599000000", minDepositAmount: "80000000",
      specsJson: { engine: "1.5L Turbo Mild-Hybrid", power: "204 hp", torque: "300 Nm", transmission: "9G-TRONIC", fuel: "Xăng", seats: 5, fuelConsumption: "6.5L/100km" },
    },
    // 34. Mercedes-Benz GLC 300
    {
      modelId: getModel("GLC 300").id, variantName: "GLC 300 4MATIC AMG-Line", listedPrice: "2799000000", minDepositAmount: "100000000",
      specsJson: { engine: "2.0L Turbo Mild-Hybrid", power: "258 hp", torque: "400 Nm", transmission: "9G-TRONIC", fuel: "Xăng", seats: 5, fuelConsumption: "7.8L/100km" },
    },
    // 35. Mercedes-Benz S 450
    {
      modelId: getModel("S 450").id, variantName: "S 450 4MATIC Luxury", listedPrice: "5039000000", minDepositAmount: "200000000",
      specsJson: { engine: "3.0L Turbo Mild-Hybrid I6", power: "367 hp", torque: "500 Nm", transmission: "9G-TRONIC", fuel: "Xăng", seats: 5, fuelConsumption: "8.5L/100km" },
    },
    // 36. BMW 320i
    {
      modelId: getModel("320i").id, variantName: "BMW 320i Sport LCI", listedPrice: "1499000000", minDepositAmount: "50000000",
      specsJson: { engine: "2.0L TwinPower Turbo", power: "184 hp", torque: "300 Nm", transmission: "8AT Steptronic", fuel: "Xăng", seats: 5, fuelConsumption: "6.4L/100km" },
    },
    // 37. BMW X5
    {
      modelId: getModel("X5").id, variantName: "BMW X5 xDrive40i M Sport", listedPrice: "3909000000", minDepositAmount: "150000000",
      specsJson: { engine: "3.0L TwinPower Turbo I6", power: "381 hp", torque: "520 Nm", transmission: "8AT Steptronic", fuel: "Xăng", seats: 7, fuelConsumption: "9.0L/100km" },
    },
    // 38. Lexus RX 350
    {
      modelId: getModel("RX 350").id, variantName: "Lexus RX 350 Luxury", listedPrice: "4340000000", minDepositAmount: "200000000",
      specsJson: { engine: "2.4L Turbo Direct-Shift", power: "275 hp", torque: "430 Nm", transmission: "8AT", fuel: "Xăng", seats: 5, fuelConsumption: "8.8L/100km" },
    },
    // 39. Lexus ES 250
    {
      modelId: getModel("ES 250").id, variantName: "Lexus ES 250 F-Sport", listedPrice: "2620000000", minDepositAmount: "100000000",
      specsJson: { engine: "2.5L Direct-Shift", power: "204 hp", torque: "247 Nm", transmission: "8AT", fuel: "Xăng", seats: 5, fuelConsumption: "6.6L/100km" },
    },
    // 40. Mitsubishi Xpander
    {
      modelId: getModel("Xpander").id, variantName: "Xpander AT Premium", listedPrice: "658000000", minDepositAmount: "30000000",
      specsJson: { engine: "1.5L MIVEC", power: "105 hp", torque: "141 Nm", transmission: "4AT", fuel: "Xăng", seats: 7, fuelConsumption: "6.9L/100km" },
    },
  ];

  const variants = await db.insert(schema.vehicleVariants).values(rawVariants).returning();

  // 7. Vehicle Images (Curated High-Res Real Imagery mapped by BodyType)
  console.log("🖼️ Seeding high-resolution real vehicle imagery for all 40 cars...");
  // 7. Vehicle Images (Curated High-Res Real Imagery mapped by Model Name)
  console.log("🖼️ Seeding high-resolution real vehicle imagery for all 40 cars...");
  const modelSpecificImages: Record<string, string[]> = {
    "Veloz Cross": [
      "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    ],
    Vios: [
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    ],
    Camry: [
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
    ],
    "Corolla Cross": [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    ],
    Fortuner: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    Raize: [
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    ],
    Ranger: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    Everest: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    Territory: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    ],
    Explorer: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    City: [
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    ],
    "CR-V": [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    ],
    Civic: [
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
    ],
    "HR-V": [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    ],
    VF5: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    ],
    VF6: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    ],
    VF7: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    VF8: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    VF9: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    Accent: [
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    ],
    Creta: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    ],
    Tucson: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    "Santa Fe": [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    Stargazer: [
      "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    ],
    Morning: [
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    ],
    Seltos: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    ],
    Carnival: [
      "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    ],
    K5: [
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
    ],
    Sportage: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    Mazda3: [
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
    ],
    "CX-5": [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    "CX-8": [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    "C 200": [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    ],
    "GLC 300": [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    "S 450": [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    ],
    "320i": [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
    ],
    X5: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    "RX 350": [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    "ES 250": [
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
    ],
    Xpander: [
      "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    ],
  };

  const defaultCategoryImages: Record<string, string[]> = {
    MPV: [
      "https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    ],
    Sedan: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
    ],
    SUV: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    CUV: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    ],
    Pickup: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    ],
    Hatchback: [
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    ],
  };

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const model = models.find((m) => m.id === variant.modelId)!;
    const images = modelSpecificImages[model.name] || defaultCategoryImages[model.bodyType] || defaultCategoryImages.SUV;

    await db.insert(schema.vehicleImages).values([
      { variantId: variant.id, imageUrl: images[0], isThumbnail: true, is360Asset: false, angleOrder: 1 },
      { variantId: variant.id, imageUrl: images[1], isThumbnail: false, is360Asset: false, angleOrder: 2 },
      { variantId: variant.id, imageUrl: images[2], isThumbnail: false, is360Asset: false, angleOrder: 3 },
    ]);
  }

  // 8. Vehicle Quotas (Varied & Realistic Inventory Counts per Variant)
  console.log("📦 Seeding showroom inventory quotas...");
  const colors = ["Trắng Ngọc Trai", "Đen Huyền Bí", "Bạc Ánh Trăng"];
  const stockPattern = [2, 4, 1, 6, 3, 5, 2, 8, 3, 1, 4, 7, 2, 5, 3, 6, 2, 4, 1, 5];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const baseHN = stockPattern[i % stockPattern.length];
    const baseHCM = stockPattern[(i + 3) % stockPattern.length];
    const baseDN = Math.max(1, stockPattern[(i + 7) % stockPattern.length] - 1);

    for (let cIndex = 0; cIndex < colors.length; cIndex++) {
      const color = colors[cIndex];
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srHN.id,
        totalPhysicalCount: baseHN + cIndex,
        softLockedCount: cIndex === 0 ? 1 : 0,
      });
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srHCM.id,
        totalPhysicalCount: baseHCM,
        softLockedCount: 0,
      });
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srDN.id,
        totalPhysicalCount: baseDN,
        softLockedCount: 0,
      });
    }
  }

  // 9. Physical Vehicles (VIN Inventory)
  console.log("🚘 Seeding physical VIN inventory...");
  const sampleVins = [
    { vin: "JTDBR3FE5A0001001", engine: "2AR0001001", variant: variants[0], color: "Trắng Ngọc Trai", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "JTDBR3FE5A0001002", engine: "2AR0001002", variant: variants[0], color: "Đen Huyền Bí", showroom: srHN, status: "LOCKED" as const },
    { vin: "JTDBR3FE5A0001003", engine: "2AR0001003", variant: variants[0], color: "Bạc Ánh Trăng", showroom: srHN, status: "RESERVED" as const },
    { vin: "JTDBR3FE5A0001004", engine: "A25A001001", variant: variants[1], color: "Trắng Ngọc Trai", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "1FA6P8CF5H5002001", engine: "SA20002001", variant: variants[6], color: "Đen Huyền Bí", showroom: srHCM, status: "AVAILABLE" as const },
    { vin: "1FA6P8CF5H5002002", engine: "SA20002002", variant: variants[7], color: "Bạc Ánh Trăng", showroom: srHCM, status: "SOLD" as const },
    { vin: "KNAP381ARP0003001", engine: "G4FL003001", variant: variants[10], color: "Trắng Ngọc Trai", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "KMHSL4AG5PU004001", engine: "G4NL004001", variant: variants[17], color: "Đỏ Rực Rỡ", showroom: srHCM, status: "AVAILABLE" as const },
    { vin: "VF8EV202600050001", engine: "EV80005001", variant: variants[17], color: "Trắng Ngọc Trai", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "VF8-2026-VIN-0001", engine: "EV80005002", variant: variants[17], color: "Trắng Ngọc Trai", showroom: srHN, status: "LOCKED" as const },
    { vin: "VF9EV202600060001", engine: "EV90006001", variant: variants[18], color: "Đen Huyền Bí", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "WDC25330000070001", engine: "M264007001", variant: variants[33], color: "Trắng Ngọc Trai", showroom: srHCM, status: "AVAILABLE" as const },
    { vin: "WBA33000000080001", engine: "B480008001", variant: variants[35], color: "Xanh Thiên Thanh", showroom: srDN, status: "TRANSFERRING" as const },
  ];

  for (const v of sampleVins) {
    await db.insert(schema.vehicles).values({
      vinNumber: v.vin,
      engineNumber: v.engine,
      variantId: v.variant.id,
      color: v.color,
      manufacturingYear: 2026,
      originType: "CKD",
      showroomId: v.showroom.id,
      status: v.status,
    });
  }

  // 10. Discount Policies
  console.log("⚙️ Seeding discount policies...");
  await db.insert(schema.discountPolicies).values([
    { role: "MANAGER" as const, maxDiscountPercentage: "5.00", maxDiscountAmount: "50000000", isActive: true },
    { role: "ADMIN" as const, maxDiscountPercentage: "10.00", maxDiscountAmount: "150000000", isActive: true },
  ]);

  // 11. CRM Leads
  console.log("📋 Seeding CRM leads...");
  await db.insert(schema.crmLeads).values([
    { customerName: "Anh Hoàng Kim Long", phone: "0912888801", email: "hoanglong@gmail.com", interestedVariantId: variants[0].id, assignedSaleId: sale1.id, leadStatus: "WON" as const, leadScore: 95 },
    { customerName: "Chị Nguyễn Mai Lan", phone: "0988112233", email: "mailan@gmail.com", interestedVariantId: variants[2].id, assignedSaleId: sale1.id, leadStatus: "CONTACTED" as const, leadScore: 75 },
    { customerName: "Anh Trần Tiến Dũng", phone: "0977445566", email: "tiendung@gmail.com", interestedVariantId: variants[6].id, assignedSaleId: sale2.id, leadStatus: "NEGOTIATING" as const, leadScore: 88 },
    { customerName: "Chị Lê Phương Anh", phone: "0933778899", email: "phuonganh@gmail.com", interestedVariantId: variants[17].id, assignedSaleId: sale3.id, leadStatus: "NEW" as const, leadScore: 60 },
    { customerName: "Anh Vũ Đức Thắng", phone: "0905123456", email: "ducthang@gmail.com", interestedVariantId: variants[33].id, assignedSaleId: sale4.id, leadStatus: "TEST_DRIVE_BOOKED" as const, leadScore: 92 },
  ]);

  // 12. Test Drive Slots & Bookings
  console.log("📅 Seeding test drive slots & bookings...");
  const today = new Date();
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + dayOffset);

    const slotStart1 = new Date(slotDate);
    slotStart1.setHours(9, 0, 0, 0);
    const slotEnd1 = new Date(slotDate);
    slotEnd1.setHours(10, 0, 0, 0);

    const slotStart2 = new Date(slotDate);
    slotStart2.setHours(14, 0, 0, 0);
    const slotEnd2 = new Date(slotDate);
    slotEnd2.setHours(15, 0, 0, 0);

    const slotsToInsert: (typeof schema.testDriveSlots.$inferInsert)[] = [
      { showroomId: srHN.id, variantId: variants[0].id, slotStart: slotStart1, slotEnd: slotEnd1, isBooked: true, customerName: "Anh Hoàng Kim Long", customerPhone: "0912888801" },
      { showroomId: srHN.id, variantId: variants[2].id, slotStart: slotStart2, slotEnd: slotEnd2, isBooked: false },
      { showroomId: srHCM.id, variantId: variants[17].id, slotStart: slotStart1, slotEnd: slotEnd1, isBooked: false },
      { showroomId: srDN.id, variantId: variants[33].id, slotStart: slotStart2, slotEnd: slotEnd2, isBooked: true, customerName: "Anh Vũ Đức Thắng", customerPhone: "0905123456" },
    ];

    await db.insert(schema.testDriveSlots).values(slotsToInsert);
  }

  // 13. Trade-in Submissions
  console.log("🔄 Seeding trade-in requests...");
  const [tradeIn1, tradeIn2] = await db
    .insert(schema.tradeInRequests)
    .values([
      {
        customerId: customer1.id,
        assignedAppraiserId: sale1.id,
        oldCarBrand: "Mazda",
        oldCarModel: "Mazda 3 Luxury",
        manufacturingYear: 2020,
        odoKm: 45000,
        expectedPrice: "480000000",
        appraisedPrice: "460000000",
        finalTradeInValue: "460000000",
        status: "ACCEPTED" as const,
      },
      {
        customerId: customer2.id,
        assignedAppraiserId: sale3.id,
        oldCarBrand: "Honda",
        oldCarModel: "Honda City RS",
        manufacturingYear: 2021,
        odoKm: 32000,
        expectedPrice: "420000000",
        appraisedPrice: "400000000",
        finalTradeInValue: "400000000",
        status: "OFFERED" as const,
      },
    ])
    .returning();

  // 14. Orders & Business Transactions
  console.log("🛒 Seeding completed orders, deposits, and loan processing...");
  const [order1, order2, order3] = await db
    .insert(schema.orders)
    .values([
      {
        orderCode: "ORD-2026-1001",
        idempotencyKey: "idempotency-key-ord-1001",
        customerId: customer1.id,
        saleId: sale1.id,
        variantId: variants[0].id,
        selectedColor: "Trắng Ngọc Trai",
        showroomId: srHN.id,
        vinNumber: sampleVins[0].vin,
        purchaseType: "DIRECT" as const,
        depositAmount: "30000000",
        totalListedPrice: "698000000",
        accessoriesTotalPrice: "15000000",
        insuranceTotalPrice: "12000000",
        tradeInOffsetId: tradeIn1.id,
        tradeInCreditValue: "460000000",
        finalPrice: "265000000",
        status: "DEPOSIT_PAID" as const,
      },
      {
        orderCode: "ORD-2026-1002",
        idempotencyKey: "idempotency-key-ord-1002",
        customerId: customer2.id,
        saleId: sale3.id,
        variantId: variants[17].id,
        selectedColor: "Trắng Ngọc Trai",
        showroomId: srHCM.id,
        vinNumber: sampleVins[8].vin,
        purchaseType: "AUTO_LOAN" as const,
        depositAmount: "50000000",
        totalListedPrice: "1270000000",
        accessoriesTotalPrice: "20000000",
        insuranceTotalPrice: "15000000",
        tradeInOffsetId: tradeIn2.id,
        tradeInCreditValue: "400000000",
        finalPrice: "905000000",
        status: "BANK_APPROVED" as const,
      },
      {
        orderCode: "ORD-2026-1003",
        idempotencyKey: "idempotency-key-ord-1003",
        customerId: customer3.id,
        saleId: sale4.id,
        variantId: variants[33].id,
        selectedColor: "Xanh Thiên Thanh",
        showroomId: srDN.id,
        purchaseType: "AUTO_LOAN" as const,
        depositAmount: "100000000",
        totalListedPrice: "2799000000",
        accessoriesTotalPrice: "35000000",
        insuranceTotalPrice: "28000000",
        finalPrice: "2862000000",
        status: "DELIVERED" as const,
      },
    ])
    .returning();

  // 15. Order History & Accessories
  console.log("📜 Seeding order history & accessories...");
  await db.insert(schema.orderStatusHistory).values([
    { orderId: order1.id, actorUserId: sale1.id, actorType: "USER" as const, oldStatus: "CREATED", newStatus: "DEPOSIT_PAID", reason: "Khách hàng đã đặt cọc 30tr thành công qua VNPAY" },
    { orderId: order2.id, actorUserId: sale3.id, actorType: "USER" as const, oldStatus: "CREATED", newStatus: "DEPOSIT_PAID", reason: "Đặt cọc 50tr cho xe VF8 Dual Motor" },
    { orderId: order2.id, actorUserId: managerHCM.id, actorType: "USER" as const, oldStatus: "DEPOSIT_PAID", newStatus: "BANK_APPROVED", reason: "Ngân hàng Techcombank đã cấp bảo lãnh vay 80%" },
  ]);

  await db.insert(schema.orderAccessories).values([
    { orderId: order1.id, itemName: "Dán phim cách nhiệt 3M Crystalline", price: "10000000", quantity: 1 },
    { orderId: order1.id, itemName: "Thảm lót sàn 6D cao cấp", price: "5000000", quantity: 1 },
  ]);

  // 16. Payments
  console.log("💳 Seeding payments...");
  await db.insert(schema.payments).values([
    {
      orderId: order1.id,
      transactionRef: "PAY-2026-0001",
      gateway: "MOCK_VNPAY" as const,
      snapshotAmount: "30000000",
      receivedAmount: "30000000",
      paymentStatus: "SUCCESS" as const,
      gatewayTransactionNo: "VNP14892019",
      gatewayPayDate: new Date(),
    },
    {
      orderId: order2.id,
      transactionRef: "PAY-2026-0002",
      gateway: "MOCK_GATEWAY" as const,
      snapshotAmount: "50000000",
      receivedAmount: "50000000",
      paymentStatus: "SUCCESS" as const,
      gatewayTransactionNo: "FT2608100223",
      gatewayPayDate: new Date(),
    },
  ]);

  // 17. Loan Applications
  console.log("🏦 Seeding loan applications...");
  await db.insert(schema.loanApplications).values([
    {
      orderId: order2.id,
      bankName: "Techcombank",
      requestedLoanAmount: "724000000",
      approvedLoanAmount: "724000000",
      loanTermMonths: 60,
      interestRatePercent: "7.50",
      status: "APPROVED" as const,
      approvalLetterUrl: "https://example.com/approval-letter-tcb.pdf",
    },
  ]);

  // 18. Vehicle Transfers
  console.log("🚚 Seeding inter-showroom vehicle transfers...");
  await db.insert(schema.vehicleTransfers).values([
    {
      transferCode: "TRF-2026-001",
      vinNumber: sampleVins[12].vin,
      fromShowroomId: srHN.id,
      toShowroomId: srDN.id,
      requestedBy: managerHN.id,
      approvedBy: admin.id,
      status: "IN_TRANSIT" as const,
      reason: "Điều chuyển xe BMW 320i đáp ứng đơn hàng gấp của khách tại Đà Nẵng",
    },
  ]);

  // 19. Refund Requests
  console.log("💸 Seeding refund requests...");
  await db.insert(schema.refundRequests).values([
    {
      refundCode: "REF-2026-001",
      orderId: order1.id,
      requestedBySale: sale1.id,
      refundAmount: "10000000",
      refundReasonType: "SYSTEM_TIMEOUT_ERROR" as const,
      bankAccountNumber: "19034567890",
      bankAccountName: "NGUYEN VAN TUAN",
      bankName: "Techcombank",
      payoutDueDate: "2026-09-01",
      status: "PENDING_MANAGER" as const,
    },
  ]);

  // 20. VIN Hold Reservations
  console.log("🔒 Seeding VIN hold reservations...");
  await db.insert(schema.vinHoldReservations).values([
    {
      vinNumber: "VF8-2026-VIN-0001",
      heldByManagerId: managerHN.id,
      customerPhone: "0912345678",
      customerName: "Nguyễn Văn An",
      holdReason: "Khóa giữ VIN 24h cho VIP Khách hàng Nguyễn Văn An xem xe chiều nay",
      holdExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ]);

  // 21. Customer Credit Accounts
  console.log("💳 Seeding credit accounts...");
  const [creditAccount1] = await db
    .insert(schema.customerCreditAccounts)
    .values([
      {
        customerId: customer1.id,
        balance: "460000000",
      },
    ])
    .returning();

  await db.insert(schema.creditTransactions).values([
    {
      accountId: creditAccount1.id,
      idempotencyKey: "idempotency-key-credit-tx-001",
      orderId: order1.id,
      amount: "460000000",
      type: "CREDIT_REFUND" as const,
      description: "Ghi nhận tín dụng thu cũ đổi xe Mazda 3 Luxury",
    },
  ]);

  // 22. Outbox Events
  console.log("📬 Seeding outbox events...");
  await db.insert(schema.outboxEvents).values([
    {
      aggregateType: "ORDER",
      aggregateId: order1.id,
      eventType: "ORDER_DEPOSIT_PAID",
      payload: { orderCode: "ORD-2026-1001", amount: 30000000, customerPhone: "0912345678" },
      status: "PROCESSED" as const,
      processedAt: new Date(),
    },
  ]);

  // 23. Audit Logs
  console.log("📜 Seeding audit logs...");
  await db.insert(schema.auditLogs).values([
    {
      actorType: "USER" as const,
      actorUserId: admin.id,
      action: "SEED_ENTERPRISE_DATABASE_40_CARS",
      entityType: "SYSTEM_DATABASE",
      entityId: "SYSTEM_SEED_V22",
      ipAddress: "127.0.0.1",
      newValue: { seedVersion: "v22.2-40cars-mapped" },
    },
  ]);

  console.log("🎉 Enterprise Database seed completed cleanly with 40 real cars mapped!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed execution failed:", err);
  process.exit(1);
});
