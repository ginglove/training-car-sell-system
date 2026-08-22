import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import * as schema from "../src/lib/db/schema";

async function seed() {
  const sql = neon(process.env.NEON_DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Showrooms
  const [sr1, sr2, sr3] = await db
    .insert(schema.showrooms)
    .values([
      { name: "Showroom Cầu Giấy - Hà Nội", code: "SR-HN-CG", address: "Số 88 Cầu Giấy, Hà Nội", phone: "024-3833-0001" },
      { name: "Showroom Quận 7 - TP.HCM", code: "SR-HCM-Q7", address: "Số 200 Nguyễn Thị Thập, Quận 7, TP.HCM", phone: "028-3773-0002" },
      { name: "Showroom Hải Châu - Đà Nẵng", code: "SR-DN-HC", address: "Số 50 Nguyễn Văn Linh, Hải Châu, Đà Nẵng", phone: "023-6382-0003" },
    ])
    .returning();

  // Users
  const passwordHash = hashSync("Admin@123", 10);
  const [admin, manager1, manager2, sale1, sale2, sale3, customer1, customer2] = await db
    .insert(schema.users)
    .values([
      { email: "admin@autodealer.vn", phone: "0900000001", passwordHash, fullName: "Nguyễn Văn Admin", role: "ADMIN" as const, showroomId: sr1.id },
      { email: "manager.hn@autodealer.vn", phone: "0900000002", passwordHash, fullName: "Trần Thị Manager HN", role: "MANAGER" as const, showroomId: sr1.id },
      { email: "manager.hcm@autodealer.vn", phone: "0900000003", passwordHash, fullName: "Lê Văn Manager HCM", role: "MANAGER" as const, showroomId: sr2.id },
      { email: "sale1@autodealer.vn", phone: "0900000004", passwordHash, fullName: "Phạm Văn Sale 1", role: "SALE" as const, showroomId: sr1.id },
      { email: "sale2@autodealer.vn", phone: "0900000005", passwordHash, fullName: "Hoàng Thị Sale 2", role: "SALE" as const, showroomId: sr1.id },
      { email: "sale3@autodealer.vn", phone: "0900000006", passwordHash, fullName: "Vũ Văn Sale 3", role: "SALE" as const, showroomId: sr2.id },
      { email: "customer1@gmail.com", phone: "0912345678", passwordHash, fullName: "Nguyễn Văn Khách A", role: "CUSTOMER" as const },
      { email: "customer2@gmail.com", phone: "0988776655", passwordHash, fullName: "Trần Thị Khách B", role: "CUSTOMER" as const },
    ])
    .returning();

  // Customer profiles
  await db.insert(schema.customerProfiles).values([
    {
      userId: customer1.id,
      identityCardNumber: "ENCRYPTED_001200001234",
      identityCardMasked: "00120000****",
      identityCardDate: "2021-08-15",
      identityCardPlace: "Cục CSQLHC về TTXH",
      permanentAddress: "Số 12 Cầu Giấy, Hà Nội",
      monthlyIncome: "25000000",
    },
    {
      userId: customer2.id,
      identityCardNumber: "ENCRYPTED_079200005678",
      identityCardMasked: "07920000****",
      identityCardDate: "2022-03-20",
      identityCardPlace: "Công an TP.HCM",
      permanentAddress: "Số 100 Nguyễn Huệ, Quận 1, TP.HCM",
      monthlyIncome: "35000000",
    },
  ]);

  // Brands
  const [toyota, ford, kia, hyundai] = await db
    .insert(schema.brands)
    .values([
      { name: "Toyota", logoUrl: "/images/brands/toyota.png" },
      { name: "Ford", logoUrl: "/images/brands/ford.png" },
      { name: "Kia", logoUrl: "/images/brands/kia.png" },
      { name: "Hyundai", logoUrl: "/images/brands/hyundai.png" },
    ])
    .returning();

  // Vehicle Models
  const [camry, corolla, everest, ranger, seltos, k5, tucson, santafe] = await db
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
    ])
    .returning();

  // Vehicle Variants
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
    ])
    .returning();

  // Vehicle Quotas
  const colors = ["Trắng Ngọc Trai", "Đen Huyền Bí", "Bạc Ánh Trăng", "Đỏ Rực Rỡ"];
  for (const variant of variants) {
    for (const color of colors.slice(0, 3)) {
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: sr1.id,
        totalPhysicalCount: Math.floor(Math.random() * 5) + 1,
        softLockedCount: 0,
      });
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: sr2.id,
        totalPhysicalCount: Math.floor(Math.random() * 3) + 1,
        softLockedCount: 0,
      });
    }
  }

  // Sample vehicles with VINs
  const sampleVins = [
    { vin: "JTDBR3FE5A0000001", engine: "2AR0000001", variant: variants[0], color: "Trắng Ngọc Trai", showroom: sr1 },
    { vin: "JTDBR3FE5A0000002", engine: "2AR0000002", variant: variants[0], color: "Đen Huyền Bí", showroom: sr1 },
    { vin: "JTDBR3FE5A0000003", engine: "2AR0000003", variant: variants[0], color: "Bạc Ánh Trăng", showroom: sr1 },
    { vin: "JTDBR3FE5A0000004", engine: "A25A000001", variant: variants[1], color: "Trắng Ngọc Trai", showroom: sr1 },
    { vin: "1FA6P8CF5H5000001", engine: "SA20000001", variant: variants[3], color: "Đen Huyền Bí", showroom: sr2 },
    { vin: "1FA6P8CF5H5000002", engine: "SA20000002", variant: variants[3], color: "Bạc Ánh Trăng", showroom: sr2 },
    { vin: "KNAP381ARP0000001", engine: "G4FL000001", variant: variants[5], color: "Trắng Ngọc Trai", showroom: sr1 },
    { vin: "KMHSL4AG5PU000001", engine: "G4NL000001", variant: variants[7], color: "Đỏ Rực Rỡ", showroom: sr2 },
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

  // Sample CRM Leads
  await db.insert(schema.crmLeads).values([
    { customerName: "Anh Hoàng Long", phone: "0912888801", email: "hoanglong@gmail.com", interestedVariantId: variants[0].id, assignedSaleId: sale1.id, leadStatus: "NEW", leadScore: 95 },
    { customerName: "Chị Mai Lan", phone: "0988112233", email: "mailan@gmail.com", interestedVariantId: variants[3].id, assignedSaleId: sale1.id, leadStatus: "CONTACTED", leadScore: 70 },
    { customerName: "Anh Trần Dũng", phone: "0977445566", interestedVariantId: variants[0].id, assignedSaleId: sale2.id, leadStatus: "NEGOTIATING", leadScore: 85 },
    { customerName: "Chị Phương Anh", phone: "0933778899", interestedVariantId: variants[5].id, assignedSaleId: sale3.id, leadStatus: "NEW", leadScore: 60 },
  ]);

  // Discount policies
  await db.insert(schema.discountPolicies).values([
    { role: "MANAGER", maxDiscountPercentage: "5.00", maxDiscountAmount: "30000000", isActive: true },
    { role: "ADMIN", maxDiscountPercentage: "10.00", maxDiscountAmount: "100000000", isActive: true },
  ]);

  console.log("Seed completed successfully!");
}

seed().catch(console.error);
