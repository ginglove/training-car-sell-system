import { getDatabase } from "@netlify/database";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import { mockEncrypt, maskCCCD } from "../src/lib/mock/kms";

async function seed() {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.error("Error: NETLIFY_DATABASE_URL, DATABASE_URL, or NEON_DATABASE_URL environment variable is required to run seed.");
    process.exit(1);
  }

  const netlifyDb = getDatabase({ connectionString });
  const sql = ("httpClient" in netlifyDb && netlifyDb.httpClient)
    ? netlifyDb.httpClient
    : neon(netlifyDb.connectionString || connectionString);
  const db = drizzle(sql, { schema });

  console.log("🚀 Starting database seed...");

  // 1. Showrooms
  console.log("📍 Seeding showrooms...");
  const [srHN, srHCM, srDN] = await db
    .insert(schema.showrooms)
    .values([
      { name: "Showroom Cầu Giấy - Hà Nội", code: "SR-HN-CG", address: "Số 88 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội", phone: "024-3833-0001" },
      { name: "Showroom Quận 7 - TP.HCM", code: "SR-HCM-Q7", address: "Số 200 Nguyễn Thị Thập, Tân Phú, Quận 7, TP.HCM", phone: "028-3773-0002" },
      { name: "Showroom Hải Châu - Đà Nẵng", code: "SR-DN-HC", address: "Số 50 Nguyễn Văn Linh, Nam Dương, Hải Châu, Đà Nẵng", phone: "023-6382-0003" },
    ])
    .returning();

  // 2. Users (Admin, Managers, Sales, Customers)
  console.log("👥 Seeding users...");
  const defaultPasswordHash = hashSync("Admin@123", 10);
  const [admin, managerHN, managerHCM, sale1, sale2, sale3, customer1, customer2] = await db
    .insert(schema.users)
    .values([
      { email: "admin@autodealer.vn", phone: "0900000001", passwordHash: defaultPasswordHash, fullName: "Nguyễn Văn Admin", role: "ADMIN" as const, showroomId: srHN.id },
      { email: "manager.hn@autodealer.vn", phone: "0900000002", passwordHash: defaultPasswordHash, fullName: "Trần Thị Manager HN", role: "MANAGER" as const, showroomId: srHN.id },
      { email: "manager.hcm@autodealer.vn", phone: "0900000003", passwordHash: defaultPasswordHash, fullName: "Lê Văn Manager HCM", role: "MANAGER" as const, showroomId: srHCM.id },
      { email: "sale1@autodealer.vn", phone: "0900000004", passwordHash: defaultPasswordHash, fullName: "Phạm Văn Sale 1", role: "SALE" as const, showroomId: srHN.id },
      { email: "sale2@autodealer.vn", phone: "0900000005", passwordHash: defaultPasswordHash, fullName: "Hoàng Thị Sale 2", role: "SALE" as const, showroomId: srHN.id },
      { email: "sale3@autodealer.vn", phone: "0900000006", passwordHash: defaultPasswordHash, fullName: "Vũ Văn Sale 3", role: "SALE" as const, showroomId: srHCM.id },
      { email: "customer1@gmail.com", phone: "0912345678", passwordHash: defaultPasswordHash, fullName: "Nguyễn Văn Khách A", role: "CUSTOMER" as const },
      { email: "customer2@gmail.com", phone: "0988776655", passwordHash: defaultPasswordHash, fullName: "Trần Thị Khách B", role: "CUSTOMER" as const },
    ])
    .returning();

  // 3. Customer Profiles (KMS Encrypted CCCD PII)
  console.log("🔒 Seeding customer profiles with encrypted PII...");
  await db.insert(schema.customerProfiles).values([
    {
      userId: customer1.id,
      identityCardNumber: mockEncrypt("001200001234"),
      identityCardMasked: maskCCCD("001200001234"),
      identityCardDate: "2021-08-15",
      identityCardPlace: "Cục CSQLHC về TTXH",
      permanentAddress: "Số 12 Cầu Giấy, Hà Nội",
      monthlyIncome: "25000000",
    },
    {
      userId: customer2.id,
      identityCardNumber: mockEncrypt("079200005678"),
      identityCardMasked: maskCCCD("079200005678"),
      identityCardDate: "2022-03-20",
      identityCardPlace: "Công an TP.HCM",
      permanentAddress: "Số 100 Nguyễn Huệ, Quận 1, TP.HCM",
      monthlyIncome: "35000000",
    },
  ]);

  // 4. Brands
  console.log("🚘 Seeding vehicle brands...");
  const [toyota, ford, kia, hyundai, vinfast] = await db
    .insert(schema.brands)
    .values([
      { name: "Toyota", logoUrl: "/images/brands/toyota.png" },
      { name: "Ford", logoUrl: "/images/brands/ford.png" },
      { name: "Kia", logoUrl: "/images/brands/kia.png" },
      { name: "Hyundai", logoUrl: "/images/brands/hyundai.png" },
      { name: "VinFast", logoUrl: "/images/brands/vinfast.png" },
    ])
    .returning();

  // 5. Vehicle Models
  console.log("🚗 Seeding vehicle models...");
  const [camry, corolla, everest, ranger, seltos, k5, tucson, santafe, vf8] = await db
    .insert(schema.vehicleModels)
    .values([
      { brandId: toyota.id, name: "Camry", bodyType: "Sedan" },
      { brandId: toyota.id, name: "Corolla Cross", bodyType: "CUV" },
      { brandId: ford.id, name: "Everest", bodyType: "SUV" },
      { brandId: ford.id, name: "Ranger", bodyType: "Pickup" },
      { brandId: kia.id, name: "Seltos", bodyType: "CUV" },
      { brandId: kia.id, name: "K5", bodyType: "Sedan" },
      { brandId: hyundai.id, name: "Tucson", bodyType: "SUV" },
      { brandId: hyundai.id, name: "Santa Fe", bodyType: "SUV" },
      { brandId: vinfast.id, name: "VF8", bodyType: "SUV" },
    ])
    .returning();

  // 6. Vehicle Variants
  console.log("⚡ Seeding vehicle variants...");
  const variants = await db
    .insert(schema.vehicleVariants)
    .values([
      {
        modelId: camry.id, variantName: "Camry 2.0Q", listedPrice: "1105000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L Dynamic Force", power: "170 hp", torque: "205 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.1L/100km" },
      },
      {
        modelId: camry.id, variantName: "Camry 2.5HEV", listedPrice: "1405000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.5L Hybrid", power: "215 hp", torque: "221 Nm", transmission: "eCVT", fuel: "Hybrid", seats: 5, fuelConsumption: "4.2L/100km" },
      },
      {
        modelId: corolla.id, variantName: "Corolla Cross 1.8V", listedPrice: "820000000", minDepositAmount: "50000000",
        specsJson: { engine: "1.8L VVT-i", power: "140 hp", torque: "177 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.8L/100km" },
      },
      {
        modelId: everest.id, variantName: "Everest Titanium+ 4WD", listedPrice: "1499000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L Bi-Turbo", power: "210 hp", torque: "500 Nm", transmission: "10AT", fuel: "Diesel", seats: 7, fuelConsumption: "8.0L/100km" },
      },
      {
        modelId: ranger.id, variantName: "Ranger Wildtrak 4x4", listedPrice: "965000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L Bi-Turbo", power: "210 hp", torque: "500 Nm", transmission: "10AT", fuel: "Diesel", seats: 5, fuelConsumption: "8.5L/100km" },
      },
      {
        modelId: seltos.id, variantName: "Seltos 1.5 Luxury", listedPrice: "699000000", minDepositAmount: "30000000",
        specsJson: { engine: "1.5L MPI", power: "114 hp", torque: "144 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.5L/100km" },
      },
      {
        modelId: k5.id, variantName: "K5 2.0 Luxury", listedPrice: "869000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L Smartstream", power: "152 hp", torque: "192 Nm", transmission: "6AT", fuel: "Xăng", seats: 5, fuelConsumption: "7.2L/100km" },
      },
      {
        modelId: tucson.id, variantName: "Tucson 2.0 Đặc Biệt", listedPrice: "920000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L MPI", power: "156 hp", torque: "192 Nm", transmission: "6AT", fuel: "Xăng", seats: 5, fuelConsumption: "7.8L/100km" },
      },
      {
        modelId: santafe.id, variantName: "Santa Fe Calligraphy", listedPrice: "1340000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.5L Turbo", power: "281 hp", torque: "422 Nm", transmission: "8DCT", fuel: "Xăng", seats: 7, fuelConsumption: "9.0L/100km" },
      },
      {
        modelId: vf8.id, variantName: "VF8 Plus Electric", listedPrice: "1270000000", minDepositAmount: "50000000",
        specsJson: { engine: "Dual Electric Motor", power: "402 hp", torque: "620 Nm", transmission: "Single Speed", fuel: "Điện", seats: 5, fuelConsumption: "471 km / lần sạc" },
      },
    ])
    .returning();

  // 7. Vehicle Images
  console.log("🖼️ Seeding vehicle images...");
  for (const variant of variants) {
    await db.insert(schema.vehicleImages).values([
      { variantId: variant.id, imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80", isThumbnail: true, is360Asset: false, angleOrder: 1 },
      { variantId: variant.id, imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80", isThumbnail: false, is360Asset: false, angleOrder: 2 },
      { variantId: variant.id, imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80", isThumbnail: false, is360Asset: false, angleOrder: 3 },
    ]);
  }

  // 8. Vehicle Quotas
  console.log("📦 Seeding vehicle quotas...");
  const colors = ["Trắng Ngọc Trai", "Đen Huyền Bí", "Bạc Ánh Trăng", "Đỏ Rực Rỡ"];
  for (const variant of variants) {
    for (const color of colors.slice(0, 3)) {
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srHN.id,
        totalPhysicalCount: 5,
        softLockedCount: 0,
      });
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srHCM.id,
        totalPhysicalCount: 3,
        softLockedCount: 0,
      });
    }
  }

  // 9. Physical Vehicles (VINs)
  console.log("🚘 Seeding physical vehicle inventory (VINs)...");
  const sampleVins = [
    { vin: "JTDBR3FE5A0000001", engine: "2AR0000001", variant: variants[0], color: "Trắng Ngọc Trai", showroom: srHN },
    { vin: "JTDBR3FE5A0000002", engine: "2AR0000002", variant: variants[0], color: "Đen Huyền Bí", showroom: srHN },
    { vin: "JTDBR3FE5A0000003", engine: "2AR0000003", variant: variants[0], color: "Bạc Ánh Trăng", showroom: srHN },
    { vin: "JTDBR3FE5A0000004", engine: "A25A000001", variant: variants[1], color: "Trắng Ngọc Trai", showroom: srHN },
    { vin: "1FA6P8CF5H5000001", engine: "SA20000001", variant: variants[3], color: "Đen Huyền Bí", showroom: srHCM },
    { vin: "1FA6P8CF5H5000002", engine: "SA20000002", variant: variants[3], color: "Bạc Ánh Trăng", showroom: srHCM },
    { vin: "KNAP381ARP0000001", engine: "G4FL000001", variant: variants[5], color: "Trắng Ngọc Trai", showroom: srHN },
    { vin: "KMHSL4AG5PU000001", engine: "G4NL000001", variant: variants[7], color: "Đỏ Rực Rỡ", showroom: srHCM },
    { vin: "VF8EV202600000001", engine: "EV80000001", variant: variants[9], color: "Trắng Ngọc Trai", showroom: srHN },
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
      status: "AVAILABLE",
    });
  }

  // 10. Test Drive Slots
  console.log("📅 Seeding test drive slots...");
  const today = new Date();
  for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
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

    await db.insert(schema.testDriveSlots).values([
      { showroomId: srHN.id, variantId: variants[0].id, slotStart: slotStart1, slotEnd: slotEnd1, isBooked: false },
      { showroomId: srHN.id, variantId: variants[3].id, slotStart: slotStart2, slotEnd: slotEnd2, isBooked: false },
      { showroomId: srHCM.id, variantId: variants[9].id, slotStart: slotStart1, slotEnd: slotEnd1, isBooked: false },
    ]);
  }

  // 11. CRM Leads
  console.log("📋 Seeding CRM leads...");
  await db.insert(schema.crmLeads).values([
    { customerName: "Anh Hoàng Long", phone: "0912888801", email: "hoanglong@gmail.com", interestedVariantId: variants[0].id, assignedSaleId: sale1.id, leadStatus: "NEW", leadScore: 95 },
    { customerName: "Chị Mai Lan", phone: "0988112233", email: "mailan@gmail.com", interestedVariantId: variants[3].id, assignedSaleId: sale1.id, leadStatus: "CONTACTED", leadScore: 70 },
    { customerName: "Anh Trần Dũng", phone: "0977445566", interestedVariantId: variants[0].id, assignedSaleId: sale2.id, leadStatus: "NEGOTIATING", leadScore: 85 },
    { customerName: "Chị Phương Anh", phone: "0933778899", interestedVariantId: variants[5].id, assignedSaleId: sale3.id, leadStatus: "NEW", leadScore: 60 },
  ]);

  // 12. Discount Policies
  console.log("⚙️ Seeding discount policies...");
  await db.insert(schema.discountPolicies).values([
    { role: "MANAGER", maxDiscountPercentage: "5.00", maxDiscountAmount: "30000000", isActive: true },
    { role: "ADMIN", maxDiscountPercentage: "10.00", maxDiscountAmount: "100000000", isActive: true },
  ]);

  console.log("✅ Seed completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
