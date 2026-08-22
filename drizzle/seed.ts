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

  console.log("🚀 Starting comprehensive enterprise database seed...");

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
  console.log("👥 Seeding users across all 6 system roles...");
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
  console.log("🔒 Seeding customer profiles with encrypted PII...");
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

  // 4. Brands
  console.log("🚘 Seeding vehicle brands...");
  const [toyota, ford, kia, hyundai, vinfast, benz, bmw, lexus] = await db
    .insert(schema.brands)
    .values([
      { name: "Toyota", logoUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80" },
      { name: "Ford", logoUrl: "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=400&q=80" },
      { name: "Kia", logoUrl: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=400&q=80" },
      { name: "Hyundai", logoUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80" },
      { name: "VinFast", logoUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80" },
      { name: "Mercedes-Benz", logoUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80" },
      { name: "BMW", logoUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80" },
      { name: "Lexus", logoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80" },
    ])
    .returning();

  // 5. Vehicle Models
  console.log("🚗 Seeding vehicle models...");
  const [camry, corolla, everest, ranger, seltos, k5, tucson, santafe, vf8, vf9, glc300, bmw320, rx350] = await db
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
      { brandId: vinfast.id, name: "VF9", bodyType: "SUV" },
      { brandId: benz.id, name: "GLC 300", bodyType: "SUV" },
      { brandId: bmw.id, name: "320i", bodyType: "Sedan" },
      { brandId: lexus.id, name: "RX 350", bodyType: "SUV" },
    ])
    .returning();

  // 6. Vehicle Variants
  console.log("⚡ Seeding vehicle variants...");
  const variants = await db
    .insert(schema.vehicleVariants)
    .values([
      {
        modelId: camry.id, variantName: "Camry 2.0Q Premium", listedPrice: "1105000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L Dynamic Force", power: "170 hp", torque: "205 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.1L/100km" },
      },
      {
        modelId: camry.id, variantName: "Camry 2.5HEV Hybrid", listedPrice: "1405000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.5L Hybrid THS II", power: "215 hp", torque: "221 Nm", transmission: "eCVT", fuel: "Hybrid", seats: 5, fuelConsumption: "4.2L/100km" },
      },
      {
        modelId: corolla.id, variantName: "Corolla Cross 1.8V", listedPrice: "820000000", minDepositAmount: "50000000",
        specsJson: { engine: "1.8L VVT-i", power: "140 hp", torque: "177 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.8L/100km" },
      },
      {
        modelId: everest.id, variantName: "Everest Titanium+ 4WD", listedPrice: "1499000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L Bi-Turbo Diesel", power: "210 hp", torque: "500 Nm", transmission: "10AT", fuel: "Diesel", seats: 7, fuelConsumption: "8.0L/100km" },
      },
      {
        modelId: ranger.id, variantName: "Ranger Wildtrak 4x4", listedPrice: "965000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L Bi-Turbo Diesel", power: "210 hp", torque: "500 Nm", transmission: "10AT", fuel: "Diesel", seats: 5, fuelConsumption: "8.5L/100km" },
      },
      {
        modelId: seltos.id, variantName: "Seltos 1.5 Luxury", listedPrice: "699000000", minDepositAmount: "30000000",
        specsJson: { engine: "1.5L Smartstream", power: "114 hp", torque: "144 Nm", transmission: "CVT", fuel: "Xăng", seats: 5, fuelConsumption: "6.5L/100km" },
      },
      {
        modelId: k5.id, variantName: "K5 2.5 GT-Line", listedPrice: "999000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.5L GDI", power: "191 hp", torque: "246 Nm", transmission: "8AT", fuel: "Xăng", seats: 5, fuelConsumption: "7.5L/100km" },
      },
      {
        modelId: tucson.id, variantName: "Tucson 1.6 Turbo AWD", listedPrice: "1050000000", minDepositAmount: "50000000",
        specsJson: { engine: "1.6L T-GDi", power: "180 hp", torque: "265 Nm", transmission: "7DCT", fuel: "Xăng", seats: 5, fuelConsumption: "7.2L/100km" },
      },
      {
        modelId: santafe.id, variantName: "Santa Fe Calligraphy 2.5T", listedPrice: "1340000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.5L Turbo Smartstream", power: "281 hp", torque: "422 Nm", transmission: "8DCT", fuel: "Xăng", seats: 7, fuelConsumption: "9.0L/100km" },
      },
      {
        modelId: vf8.id, variantName: "VF8 Plus Electric Dual-Motor", listedPrice: "1270000000", minDepositAmount: "50000000",
        specsJson: { engine: "Dual Electric Motor AWD", power: "402 hp", torque: "620 Nm", transmission: "Single Speed", fuel: "Điện", seats: 5, fuelConsumption: "471 km / lần sạc" },
      },
      {
        modelId: vf9.id, variantName: "VF9 Plus 6-Seater Luxury", listedPrice: "2170000000", minDepositAmount: "100000000",
        specsJson: { engine: "Dual Electric Motor AWD", power: "402 hp", torque: "620 Nm", transmission: "Single Speed", fuel: "Điện", seats: 6, fuelConsumption: "602 km / lần sạc" },
      },
      {
        modelId: glc300.id, variantName: "GLC 300 4MATIC AMG-Line", listedPrice: "2799000000", minDepositAmount: "100000000",
        specsJson: { engine: "2.0L Turbo Mild-Hybrid", power: "258 hp", torque: "400 Nm", transmission: "9G-TRONIC", fuel: "Xăng", seats: 5, fuelConsumption: "7.8L/100km" },
      },
      {
        modelId: bmw320.id, variantName: "BMW 320i Sport LCI", listedPrice: "1499000000", minDepositAmount: "50000000",
        specsJson: { engine: "2.0L TwinPower Turbo", power: "184 hp", torque: "300 Nm", transmission: "8AT Steptronic", fuel: "Xăng", seats: 5, fuelConsumption: "6.4L/100km" },
      },
      {
        modelId: rx350.id, variantName: "Lexus RX 350 Luxury", listedPrice: "4340000000", minDepositAmount: "200000000",
        specsJson: { engine: "2.4L Turbo Direct-Shift", power: "275 hp", torque: "430 Nm", transmission: "8AT", fuel: "Xăng", seats: 5, fuelConsumption: "8.8L/100km" },
      },
    ])
    .returning();

  // 7. Vehicle Images (Curated High-Res Unsplash Imagery)
  console.log("🖼️ Seeding high-resolution vehicle imagery...");
  const imageUrls = [
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
  ];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const img1 = imageUrls[i % imageUrls.length];
    const img2 = imageUrls[(i + 1) % imageUrls.length];
    const img3 = imageUrls[(i + 2) % imageUrls.length];

    await db.insert(schema.vehicleImages).values([
      { variantId: variant.id, imageUrl: img1, isThumbnail: true, is360Asset: false, angleOrder: 1 },
      { variantId: variant.id, imageUrl: img2, isThumbnail: false, is360Asset: false, angleOrder: 2 },
      { variantId: variant.id, imageUrl: img3, isThumbnail: false, is360Asset: false, angleOrder: 3 },
    ]);
  }

  // 8. Vehicle Quotas
  console.log("📦 Seeding showroom inventory quotas...");
  const colors = ["Trắng Ngọc Trai", "Đen Huyền Bí", "Bạc Ánh Trăng", "Đỏ Rực Rỡ", "Xanh Thiên Thanh"];
  for (const variant of variants) {
    for (const color of colors.slice(0, 3)) {
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srHN.id,
        totalPhysicalCount: 8,
        softLockedCount: 1,
      });
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srHCM.id,
        totalPhysicalCount: 6,
        softLockedCount: 0,
      });
      await db.insert(schema.vehicleQuotas).values({
        variantId: variant.id,
        color,
        showroomId: srDN.id,
        totalPhysicalCount: 4,
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
    { vin: "1FA6P8CF5H5002001", engine: "SA20002001", variant: variants[3], color: "Đen Huyền Bí", showroom: srHCM, status: "AVAILABLE" as const },
    { vin: "1FA6P8CF5H5002002", engine: "SA20002002", variant: variants[3], color: "Bạc Ánh Trăng", showroom: srHCM, status: "SOLD" as const },
    { vin: "KNAP381ARP0003001", engine: "G4FL003001", variant: variants[5], color: "Trắng Ngọc Trai", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "KMHSL4AG5PU004001", engine: "G4NL004001", variant: variants[8], color: "Đỏ Rực Rỡ", showroom: srHCM, status: "AVAILABLE" as const },
    { vin: "VF8EV202600050001", engine: "EV80005001", variant: variants[9], color: "Trắng Ngọc Trai", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "VF9EV202600060001", engine: "EV90006001", variant: variants[10], color: "Đen Huyền Bí", showroom: srHN, status: "AVAILABLE" as const },
    { vin: "WDC25330000070001", engine: "M264007001", variant: variants[11], color: "Trắng Ngọc Trai", showroom: srHCM, status: "AVAILABLE" as const },
    { vin: "WBA33000000080001", engine: "B480008001", variant: variants[12], color: "Xanh Thiên Thanh", showroom: srDN, status: "TRANSFERRING" as const },
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
    { customerName: "Chị Nguyễn Mai Lan", phone: "0988112233", email: "mailan@gmail.com", interestedVariantId: variants[3].id, assignedSaleId: sale1.id, leadStatus: "CONTACTED" as const, leadScore: 75 },
    { customerName: "Anh Trần Tiến Dũng", phone: "0977445566", email: "tiendung@gmail.com", interestedVariantId: variants[9].id, assignedSaleId: sale2.id, leadStatus: "NEGOTIATING" as const, leadScore: 88 },
    { customerName: "Chị Lê Phương Anh", phone: "0933778899", email: "phuonganh@gmail.com", interestedVariantId: variants[5].id, assignedSaleId: sale3.id, leadStatus: "NEW" as const, leadScore: 60 },
    { customerName: "Anh Vũ Đức Thắng", phone: "0905123456", email: "ducthang@gmail.com", interestedVariantId: variants[12].id, assignedSaleId: sale4.id, leadStatus: "TEST_DRIVE_BOOKED" as const, leadScore: 92 },
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
      { showroomId: srHN.id, variantId: variants[3].id, slotStart: slotStart2, slotEnd: slotEnd2, isBooked: false },
      { showroomId: srHCM.id, variantId: variants[9].id, slotStart: slotStart1, slotEnd: slotEnd1, isBooked: false },
      { showroomId: srDN.id, variantId: variants[12].id, slotStart: slotStart2, slotEnd: slotEnd2, isBooked: true, customerName: "Anh Vũ Đức Thắng", customerPhone: "0905123456" },
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
        vinNumber: "JTDBR3FE5A0001001",
        purchaseType: "DIRECT" as const,
        depositAmount: "50000000",
        totalListedPrice: "1105000000",
        accessoriesTotalPrice: "15000000",
        insuranceTotalPrice: "12000000",
        tradeInOffsetId: tradeIn1.id,
        tradeInCreditValue: "460000000",
        finalPrice: "672000000",
        status: "DEPOSIT_PAID" as const,
      },
      {
        orderCode: "ORD-2026-1002",
        idempotencyKey: "idempotency-key-ord-1002",
        customerId: customer2.id,
        saleId: sale3.id,
        variantId: variants[9].id,
        selectedColor: "Trắng Ngọc Trai",
        showroomId: srHCM.id,
        vinNumber: "VF8EV202600050001",
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
        variantId: variants[12].id,
        selectedColor: "Xanh Thiên Thanh",
        showroomId: srDN.id,
        purchaseType: "AUTO_LOAN" as const,
        depositAmount: "50000000",
        totalListedPrice: "1499000000",
        accessoriesTotalPrice: "0",
        insuranceTotalPrice: "18000000",
        finalPrice: "1517000000",
        status: "REFUND_REQUESTED" as const,
      },
    ])
    .returning();

  // 15. Order Status History & Accessories
  console.log("📜 Seeding order history & accessories...");
  await db.insert(schema.orderAccessories).values([
    { orderId: order1.id, itemName: "Phim cách nhiệt 3M Crystalline", price: "10000000", quantity: 1 },
    { orderId: order1.id, itemName: "Thảm lót sàn KATA cao cấp", price: "5000000", quantity: 1 },
    { orderId: order2.id, itemName: "Bộ sạc di động VinFast 7.4kW", price: "20000000", quantity: 1 },
  ]);

  await db.insert(schema.orderStatusHistory).values([
    { orderId: order1.id, oldStatus: "PENDING_PAYMENT", newStatus: "DEPOSIT_PAID", actorType: "USER" as const, actorUserId: customer1.id, reason: "Đã thanh toán cọc 50.000.000đ qua VietQR" },
    { orderId: order2.id, oldStatus: "DEPOSIT_PAID", newStatus: "BANK_APPROVING", actorType: "USER" as const, actorUserId: sale3.id, reason: "Đã nộp hồ sơ vay ngân hàng TPBank" },
    { orderId: order2.id, oldStatus: "BANK_APPROVING", newStatus: "BANK_APPROVED", actorType: "SYSTEM" as const, reason: "TPBank phê duyệt hạn mức vay 800.000.000đ" },
  ]);

  // 16. Payments
  console.log("💳 Seeding payments...");
  await db.insert(schema.payments).values([
    {
      orderId: order1.id,
      attemptNo: 1,
      transactionRef: "TXN-2026-PAY-001",
      gateway: "MOCK_VIETQR" as const,
      snapshotAmount: "50000000",
      receivedAmount: "50000000",
      paymentStatus: "SUCCESS" as const,
      gatewayTransactionNo: "VNP14890001",
      gatewayResponseCode: "00",
      gatewayBankCode: "MBBANK",
    },
    {
      orderId: order2.id,
      attemptNo: 1,
      transactionRef: "TXN-2026-PAY-002",
      gateway: "MOCK_VNPAY" as const,
      snapshotAmount: "50000000",
      receivedAmount: "50000000",
      paymentStatus: "SUCCESS" as const,
      gatewayTransactionNo: "VNP14890002",
      gatewayResponseCode: "00",
      gatewayBankCode: "TPBANK",
    },
  ]);

  // 17. Loan Applications
  console.log("🏦 Seeding loan applications...");
  await db.insert(schema.loanApplications).values([
    {
      orderId: order2.id,
      bankName: "TPBank",
      switchCount: 0,
      requestedLoanAmount: "800000000",
      approvedLoanAmount: "800000000",
      loanTermMonths: 84,
      interestRatePercent: "7.50",
      hasCoBorrower: true,
      coBorrowerName: "Nguyễn Thị Mai",
      coBorrowerPhone: "0988990011",
      status: "APPROVED" as const,
      approvalLetterUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    },
    {
      orderId: order3.id,
      bankName: "VIB",
      switchCount: 1,
      requestedLoanAmount: "1200000000",
      loanTermMonths: 60,
      interestRatePercent: "8.20",
      status: "REJECTED" as const,
      rejectionReason: "Tỷ lệ nợ trên thu nhập DTI vượt quá quy định 70%",
    },
  ]);

  // 18. Vehicle Transfers
  console.log("🚚 Seeding inter-showroom vehicle transfers...");
  await db.insert(schema.vehicleTransfers).values({
    transferCode: "TRF-2026-001",
    vinNumber: "WBA33000000080001",
    fromShowroomId: srHN.id,
    toShowroomId: srDN.id,
    logisticsFee: "3500000",
    requestedBy: sale4.id,
    approvedBy: managerHN.id,
    status: "IN_TRANSIT" as const,
    reason: "Điều chuyển xe BMW 320i đáp ứng yêu cầu giao xe gấp của khách hàng Đà Nẵng",
  });

  // 19. Refund Requests
  console.log("💸 Seeding refund requests...");
  await db.insert(schema.refundRequests).values({
    refundCode: "REF-2026-001",
    orderId: order3.id,
    requestedBySale: sale4.id,
    confirmedByManager: managerHN.id,
    refundAmount: "50000000",
    refundReasonType: "BANK_LOAN_REJECTED" as const,
    bankRejectionLetterUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    bankAccountNumber: "190345678901",
    bankAccountName: "LE HOANG NAM",
    bankName: "Techcombank",
    payoutDueDate: "2026-08-30",
    status: "PENDING_ADMIN" as const,
  });

  // 20. Audit Logs
  console.log("📜 Seeding audit logs...");
  await db.insert(schema.auditLogs).values([
    {
      actorType: "USER" as const,
      actorUserId: managerHN.id,
      action: "DECRYPT_CUSTOMER_PII",
      entityType: "CUSTOMER_PROFILE",
      entityId: customer1.id,
      decryptedUserIds: [customer1.id],
      ipAddress: "14.225.20.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      correlationId: "corr-audit-001",
    },
    {
      actorType: "USER" as const,
      actorUserId: sale1.id,
      action: "CREATE_ORDER",
      entityType: "ORDER",
      entityId: order1.id,
      newValue: { orderCode: "ORD-2026-1001", finalPrice: 672000000 },
      ipAddress: "14.225.20.12",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      correlationId: "corr-audit-002",
    },
  ]);

  console.log("🎉 Database seed completed cleanly with rich enterprise test data!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
