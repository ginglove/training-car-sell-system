#!/usr/bin/env python3
import json
import os

openapi_spec = {
    "openapi": "3.0.3",
    "info": {
        "title": "AutoDealership Enterprise Platform - QA Training & API Specification",
        "version": "25.0.0-Master-Ultimate",
        "description": """# AutoDealership Enterprise API & QA Training Center
Welcome to the interactive API Documentation and Tester Training Center for the **AutoDealership Enterprise Platform**.

This documentation is designed specifically for **QA Engineers, Testers, and Developers** undergoing system onboarding and API verification.

### System Architecture Highlights:
- **Framework**: Next.js 14+ App Router & NextAuth.js (Auth.js v5)
- **Database**: Neon Serverless PostgreSQL with Drizzle ORM
- **Security**: AES-256-GCM PII Encryption (CCCD/CMND), Role-Based Access Control (RBAC), Immutable Audit Logging
- **Sandbox Test Fixtures**: Mock Payment Webhooks, Mock Banking Credit Approvals, Sandbox OTP verification (`888888`)

---
### Default Test Accounts (Password: `Admin@123` for all accounts)
| Role | Email / Identity | Phone | Showroom Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@autodealer.vn` | `0900000001` | System Wide (Full Permissions) |
| **MANAGER (HN)** | `manager.hn@autodealer.vn` | `0900000002` | Showroom Cầu Giấy - Hà Nội |
| **MANAGER (HCM)** | `manager.hcm@autodealer.vn` | `0900000003` | Showroom Quận 7 - TP.HCM |
| **SALE (HN)** | `sale1@autodealer.vn` | `0900000004` | Showroom Cầu Giấy (Assigned Leads) |
| **SALE (HCM)** | `sale3@autodealer.vn` | `0900000006` | Showroom Quận 7 (Assigned Leads) |
| **CUSTOMER** | `customer1@gmail.com` | `0912345678` | Retail Customer Portal |
| **CUSTOMER** | `customer2@gmail.com` | `0988776655` | Retail Customer Portal |

*Sandbox OTP Code for all SMS verifications:* **`888888`**
""",
        "contact": {
            "name": "AutoDealership QA & Platform Engineering Team",
            "email": "qa-support@autodealer.vn"
        }
    },
    "servers": [
        {
            "url": "http://localhost:3000",
            "description": "Local Development Server"
        },
        {
            "url": "https://training-car-sell-system.vercel.app",
            "description": "Vercel Production / Staging Environment"
        }
    ],
    "tags": [
        { "name": "1. Authentication & Security", "description": "NextAuth Credentials, Sandbox OTP verification, Registration & Password recovery" },
        { "name": "2. User Profiles & KMS PII", "description": "Customer personal details, masked CCCD and AES-256-GCM encrypted legal identity" },
        { "name": "3. Catalog & Showrooms", "description": "40 real car models, variants, specifications, 3D glb assets & showroom branches" },
        { "name": "4. Test Drive Scheduling", "description": "Slot availability calendar and booking appointments" },
        { "name": "5. Orders & Deposit Checkout", "description": "Vehicle booking, soft quota reservation, accessories, insurance & order tracking" },
        { "name": "6. Payments & Sandbox Webhooks", "description": "Server-Sent Events (SSE) payment stream & Mock Gateway simulator for QA" },
        { "name": "7. Loans & Banking Simulator", "description": "Bank switching (max 3 times) & automated mock bank credit approval underwriting" },
        { "name": "8. Trade-In Vehicle Exchange", "description": "Customer used car valuation & rigid State Machine appraisal lifecycle" },
        { "name": "9. Refunds Management", "description": "Two-tier deposit refund approval workflow (Showroom Manager -> Super Admin)" },
        { "name": "10. Inventory & Fleet Operations", "description": "VIN level stock tracking, 24h manual VIN holds, inter-showroom transfers & damage reports" },
        { "name": "11. CRM & Lead Pipeline", "description": "Customer lead acquisition, showroom assignment, follow-ups & sales funnel" },
        { "name": "12. Admin & System Governance", "description": "Staff account provisioning, discount ceilings (<10%), immutable audit logs & PII decryption" }
    ],
    "components": {
        "securitySchemes": {
            "sessionAuth": {
                "type": "apiKey",
                "in": "cookie",
                "name": "authjs.session-token",
                "description": "NextAuth v5 session cookie. Automatically maintained by browser sessions upon logging in at /login."
            },
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JSON Web Token (JWT) passed in 'Authorization: Bearer <token>' header."
            }
        },
        "schemas": {
            "ApiSuccess": {
                "type": "object",
                "properties": {
                    "success": { "type": "boolean", "example": True },
                    "data": { "type": "object", "description": "Response payload" }
                },
                "required": ["success", "data"]
            },
            "ApiError": {
                "type": "object",
                "properties": {
                    "success": { "type": "boolean", "example": False },
                    "error": {
                        "type": "object",
                        "properties": {
                            "code": { "type": "string", "example": "ERR_UI_031" },
                            "message": { "type": "string", "example": "Định dạng số điện thoại không hợp lệ" },
                            "details": {
                                "type": "array",
                                "items": { "type": "object" },
                                "description": "Field validation breakdown"
                            }
                        },
                        "required": ["code", "message"]
                    }
                },
                "required": ["success", "error"]
            }
        }
    },
    "paths": {}
}

# Helper to register path
paths = openapi_spec["paths"]

# 1. AUTH
paths["/api/auth/callback/credentials"] = {
    "post": {
        "tags": ["1. Authentication & Security"],
        "summary": "Sign In (NextAuth Credentials Provider)",
        "description": """Authenticates a user via Email/Phone and Password, or via Sandbox OTP.
On success, creates a session JWT and sets `authjs.session-token` / `next-auth.session-token` HTTP-only cookie.
Locks account for 30 minutes after 5 consecutive failed attempts.""",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["identity"],
                        "properties": {
                            "identity": { "type": "string", "example": "admin@autodealer.vn", "description": "Email or 10-digit Phone number" },
                            "password": { "type": "string", "example": "Admin@123", "description": "User password (required if mode is 'password')" },
                            "otp": { "type": "string", "example": "888888", "description": "6-digit OTP (required if mode is 'otp')" },
                            "mode": { "type": "string", "enum": ["password", "otp"], "default": "password" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Authentication successful, session token set in Set-Cookie header" },
            "401": {
                "description": "Invalid credentials or account locked",
                "content": {
                    "application/json": {
                        "examples": {
                            "WrongPassword": { "value": { "error": "ERR_UI_003", "message": "Mật khẩu không chính xác" } },
                            "AccountLocked": { "value": { "error": "ERR_UI_004", "message": "Tài khoản bị tạm khóa 30 phút do nhập sai quá 5 lần" } },
                            "InvalidOTP": { "value": { "error": "ERR_UI_005", "message": "Mã OTP không hợp lệ hoặc đã hết hạn" } }
                        }
                    }
                }
            }
        }
    }
}


paths["/api/v1/auth/login"] = {
    "post": {
        "tags": ["1. Authentication & Security"],
        "summary": "Sign In (REST API - Returns JWT Token & Sets Session Cookie)",
        "description": """**Premier RESTful Authentication for QA / API Testers:**
Authenticates user using Email or Phone with Password (or Sandbox OTP \`888888\`).
Returns a signed JWT Bearer token in \`data.token\` AND sets HTTP-only session cookies (\`authjs.session-token\`).
Testers can copy \`data.token\` and click **Authorize 🔒** in Swagger UI to authenticate all secured requests!""",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["identity"],
                        "properties": {
                            "identity": { "type": "string", "example": "admin@autodealer.vn", "description": "Email or Phone number" },
                            "password": { "type": "string", "example": "Admin@123", "description": "Account password (if mode == password)" },
                            "otp": { "type": "string", "example": "888888", "description": "6-digit OTP code (if mode == otp)" },
                            "mode": { "type": "string", "enum": ["password", "otp"], "default": "password" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Sign in successful. JWT token returned and cookies set.",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "data": {
                                "message": "Đăng nhập thành công",
                                "token": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...",
                                "user": {
                                    "id": "u-admin-uuid",
                                    "email": "admin@autodealer.vn",
                                    "fullName": "Nguyễn Văn Admin",
                                    "phone": "0900000001",
                                    "role": "ADMIN",
                                    "showroomId": "sr-hn-cg-uuid"
                                }
                            }
                        }
                    }
                }
            },
            "400": { "description": "ERR_VALIDATION or ERR_UI_005 (Mã OTP không đúng)" },
            "401": { "description": "ERR_UI_003 (Mật khẩu sai) hoặc ERR_UI_004 (Tài khoản bị khóa 30p do nhập sai 5 lần)" }
        }
    }
}

paths["/api/v1/auth/otp/send"] = {
    "post": {
        "tags": ["1. Authentication & Security"],
        "summary": "Request SMS Verification OTP (Sandbox)",
        "description": "Generates a 6-digit verification OTP. In Sandbox/Dev, always responds with sandbox code `888888`.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["phone"],
                        "properties": {
                            "phone": { "type": "string", "example": "0912345678", "description": "Vietnamese mobile number: ^(0|84)[35789][0-9]{8}$" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "OTP dispatched successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "data": { "message": "OTP đã được gửi tới số điện thoại 0912345678", "sandboxCode": "888888" }
                        }
                    }
                }
            },
            "400": {
                "description": "Validation failure",
                "content": {
                    "application/json": {
                        "example": { "success": False, "error": { "code": "ERR_UI_031", "message": "Định dạng số điện thoại không hợp lệ (Ví dụ: 0912345678)" } }
                    }
                }
            }
        }
    }
}

paths["/api/v1/auth/register"] = {
    "post": {
        "tags": ["1. Authentication & Security"],
        "summary": "Register New Customer Account",
        "description": """Registers a new customer account with strict validations:
1. Full Name: 2-100 chars (`ERR_REG_003`)
2. RFC5322 Email regex (`ERR_REG_003`)
3. VN Mobile Phone: `^(0|84)[35789][0-9]{8}$` (`ERR_REG_003`)
4. Password Complexity: min 10 chars, 1 uppercase, 1 lowercase, 1 number, 1 special symbol (`ERR_REG_003`)
5. OTP Verification: code must match `888888` (`ERR_REG_002`)
6. Duplicate Email/Phone check (`ERR_REG_001`)""",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["fullName", "email", "phone", "password", "otpCode"],
                        "properties": {
                            "fullName": { "type": "string", "example": "Nguyễn Hoàng Nam" },
                            "email": { "type": "string", "example": "hoangnam.tester@gmail.com" },
                            "phone": { "type": "string", "example": "0987654321" },
                            "password": { "type": "string", "example": "TestCar@2026!" },
                            "otpCode": { "type": "string", "example": "888888" }
                        }
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Account created successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "data": {
                                "message": "Đăng ký tài khoản thành công",
                                "user": {
                                    "id": "c1f72a5b-9d41-4cf1-872e-0a5621437190",
                                    "email": "hoangnam.tester@gmail.com",
                                    "phone": "0987654321",
                                    "fullName": "Nguyễn Hoàng Nam",
                                    "role": "CUSTOMER"
                                }
                            }
                        }
                    }
                }
            },
            "400": { "description": "Missing required fields or invalid OTP (ERR_REG_002)" },
            "409": { "description": "Duplicate email or phone number (ERR_REG_001)" },
            "422": { "description": "Validation regex or length violation (ERR_REG_003)" }
        }
    }
}

paths["/api/v1/auth/reset-password"] = {
    "post": {
        "tags": ["1. Authentication & Security"],
        "summary": "Reset Forgotten Password",
        "description": "Resets user password after verifying OTP code `888888`. Requires strong password syntax.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["identity", "otpCode", "newPassword"],
                        "properties": {
                            "identity": { "type": "string", "example": "customer1@gmail.com" },
                            "otpCode": { "type": "string", "example": "888888" },
                            "newPassword": { "type": "string", "example": "NewSecurePass@2026" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Password reset successful" },
            "400": { "description": "ERR_UI_005 (Invalid OTP) or ERR_UI_002 (Weak password)" },
            "404": { "description": "ERR_UI_003 (User not found)" }
        }
    }
}

# 2. USERS
paths["/api/v1/users/profile"] = {
    "get": {
        "tags": ["2. User Profiles & KMS PII"],
        "summary": "Get Current User Profile & Masked CCCD",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Retrieves authenticated user details. Identity Card number (CCCD) is returned masked (e.g. `0012****1234`) for privacy protection.",
        "responses": {
            "200": {
                "description": "Profile fetched successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "data": {
                                "id": "u-admin-uuid",
                                "email": "admin@autodealer.vn",
                                "fullName": "Nguyễn Văn Admin",
                                "phone": "0900000001",
                                "role": "ADMIN",
                                "profile": {
                                    "identityCardMasked": "0012****1234",
                                    "identityCardDate": "2021-08-15",
                                    "identityCardPlace": "Cục CSQLHC về TTXH",
                                    "permanentAddress": "Số 12 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
                                    "monthlyIncome": "35000000"
                                }
                            }
                        }
                    }
                }
            },
            "401": { "description": "Unauthorized session" }
        }
    },
    "put": {
        "tags": ["2. User Profiles & KMS PII"],
        "summary": "Update Profile & CCCD Legal Information",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": """Updates personal profile and CCCD identity card.
Validations:
- Full Name: 2-100 chars (`ERR_UI_048`)
- Permanent Address: 10-255 chars (`ERR_UI_048`)
- Issue Date: cannot be future date (`ERR_UI_048`)
- CCCD Number: exactly 12 digits (`ERR_UI_048`)
- Unique CCCD check across system (`ERR_UI_049`)
Raw CCCD is encrypted via AES-256-GCM before DB persistence.""",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "fullName": { "type": "string", "example": "Nguyễn Văn Tuấn" },
                            "identityCardNumber": { "type": "string", "example": "001200001234", "description": "12 digits citizen ID" },
                            "identityCardDate": { "type": "string", "format": "date", "example": "2021-08-15" },
                            "identityCardPlace": { "type": "string", "example": "Cục CSQLHC về TTXH" },
                            "permanentAddress": { "type": "string", "example": "Số 12 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội" },
                            "monthlyIncome": { "type": "string", "example": "40000000" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Profile updated successfully" },
            "400": { "description": "ERR_UI_048: Validation error on name, address, or CCCD" },
            "409": { "description": "ERR_UI_049: CCCD number already exists in system" }
        }
    }
}

paths["/api/v1/users/change-password"] = {
    "put": {
        "tags": ["2. User Profiles & KMS PII"],
        "summary": "Change Account Password",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Allows logged in user to change their password.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["currentPassword", "newPassword"],
                        "properties": {
                            "currentPassword": { "type": "string", "example": "Admin@123" },
                            "newPassword": { "type": "string", "example": "NewPass@2026Enterprise!" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Password updated successfully" },
            "400": { "description": "ERR_UI_002: Password complexity requirements not met" },
            "401": { "description": "ERR_UI_003: Current password is incorrect" }
        }
    }
}

# 3. CATALOG & SHOWROOMS
paths["/api/v1/catalog/models"] = {
    "get": {
        "tags": ["3. Catalog & Showrooms"],
        "summary": "List & Search Vehicle Models",
        "description": "Returns car models with brand badges, starting price, trims/variants, and marketing images.",
        "parameters": [
            { "name": "bodyType", "in": "query", "schema": { "type": "string", "enum": ["SUV", "SEDAN", "HATCHBACK", "PICKUP", "MPV", "EV"] } },
            { "name": "priceRange", "in": "query", "schema": { "type": "string", "enum": ["UNDER_800M", "800M_1B2", "1B2_2B", "OVER_2B"] } },
            { "name": "purpose", "in": "query", "schema": { "type": "string", "enum": ["FAMILY", "BUSINESS", "URBAN", "LUXURY"] } },
            { "name": "search", "in": "query", "schema": { "type": "string" }, "description": "Keyword in car model name (e.g. 'Everest', 'Ranger', 'C-Class')" }
        ],
        "responses": {
            "200": { "description": "List of vehicle models matching criteria" }
        }
    }
}

paths["/api/v1/catalog/variants/{id}"] = {
    "get": {
        "tags": ["3. Catalog & Showrooms"],
        "summary": "Get Vehicle Variant Details & 3D Assets",
        "description": "Returns full variant specs, listed price, minimum deposit, available exterior colors, showroom stock quotas, and 3D GLB model paths.",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" }, "description": "Vehicle Variant UUID" }
        ],
        "responses": {
            "200": { "description": "Detailed variant specifications and color quotas" },
            "404": { "description": "Variant not found" }
        }
    }
}

paths["/api/v1/showrooms"] = {
    "get": {
        "tags": ["3. Catalog & Showrooms"],
        "summary": "List Authorized Dealership Showrooms",
        "description": "Returns list of 4 showrooms (Hà Nội Cầu Giấy, TP.HCM Q7, Đà Nẵng Hải Châu, Nghệ An Vinh) with coordinates and hotline.",
        "responses": {
            "200": { "description": "Showrooms list retrieved" }
        }
    }
}

# 4. TEST DRIVES
paths["/api/v1/test-drives/slots"] = {
    "get": {
        "tags": ["4. Test Drive Scheduling"],
        "summary": "Query Available Test Drive Slots",
        "description": "Checks test drive availability for a given showroom and date (standard 8 slots between 08:00 and 17:30).",
        "parameters": [
            { "name": "showroom_id", "in": "query", "required": True, "schema": { "type": "string", "format": "uuid" } },
            { "name": "date", "in": "query", "required": True, "schema": { "type": "string", "format": "date", "example": "2026-09-10" } },
            { "name": "variant_id", "in": "query", "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
            "200": { "description": "Hourly slot schedules with isBooked flag" },
            "400": { "description": "Missing showroom_id or date" }
        }
    }
}

paths["/api/v1/test-drives/book"] = {
    "post": {
        "tags": ["4. Test Drive Scheduling"],
        "summary": "Book a Test Drive Slot",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Reserves an open test drive slot. Validates VN phone regex. If booked by Sales consultant, auto-assigns lead.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["slotId", "variantId", "showroomId", "driverName", "driverPhone"],
                        "properties": {
                            "slotId": { "type": "string", "format": "uuid" },
                            "variantId": { "type": "string", "format": "uuid" },
                            "showroomId": { "type": "string", "format": "uuid" },
                            "driverName": { "type": "string", "example": "Lê Văn An" },
                            "driverPhone": { "type": "string", "example": "0912345678" }
                        }
                    }
                }
            }
        },
        "responses": {
            "201": { "description": "Test drive slot booked successfully" },
            "400": { "description": "ERR_UI_031: Invalid driver phone number" },
            "409": { "description": "ERR_UI_030: Slot conflict / already booked by another driver" }
        }
    }
}

# 5. ORDERS
paths["/api/v1/orders/deposit"] = {
    "post": {
        "tags": ["5. Orders & Deposit Checkout"],
        "summary": "Create Vehicle Deposit Order (Soft Inventory Lock)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": """Core Checkout endpoint:
1. Atomically soft-locks vehicle quota in showroom (`soft_locked_count + 1`). Returns `ERR_UI_040` if out of stock.
2. Calculates total price = listed price + accessories + insurance (15M) - trade-in credit.
3. Generates unique orderCode (`ORD-YYYYMMDD-XXXX`) and idempotency key.
4. Generates initial transaction reference and payment record with status `PENDING_PAYMENT`.""",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["variantId", "selectedColor"],
                        "properties": {
                            "variantId": { "type": "string", "format": "uuid" },
                            "selectedColor": { "type": "string", "example": "Trắng Ngọc Trai" },
                            "showroomId": { "type": "string", "format": "uuid", "description": "Optional: defaults to available stock showroom" },
                            "purchaseType": { "type": "string", "enum": ["DIRECT", "INSTALLMENT"], "default": "DIRECT" },
                            "paymentMethod": { "type": "string", "enum": ["MOCK_GATEWAY", "BANK_TRANSFER"], "default": "MOCK_GATEWAY" },
                            "includeInsurance": { "type": "boolean", "default": False },
                            "tradeInOffsetId": { "type": "string", "format": "uuid", "nullable": True },
                            "tradeInCreditValue": { "type": "number", "example": 0 },
                            "accessories": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": { "type": "string", "example": "Dán phim cách nhiệt 3M Crystalline" },
                                        "price": { "type": "number", "example": 15000000 },
                                        "quantity": { "type": "integer", "example": 1 }
                                    }
                                }
                            },
                            "idempotencyKey": { "type": "string", "example": "idem-uuid-9988" }
                        }
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Order created & soft quota reserved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "data": {
                                "orderId": "ord-uuid-1122",
                                "orderCode": "ORD-20260905-ABCD",
                                "transactionRef": "TXN-1725494400-abcd1234",
                                "depositAmount": 50000000,
                                "finalPrice": 1250000000
                            }
                        }
                    }
                }
            },
            "400": { "description": "Missing required fields" },
            "409": { "description": "ERR_UI_040: Vehicle out of stock or duplicate idempotency request" }
        }
    }
}

paths["/api/v1/orders/my"] = {
    "get": {
        "tags": ["5. Orders & Deposit Checkout"],
        "summary": "List Orders for Authenticated User",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "If role is CUSTOMER, returns their placed orders. If SALE/MANAGER, returns orders managed in their showroom scope.",
        "responses": {
            "200": { "description": "List of user orders with variant, showroom, and payment details" }
        }
    }
}

paths["/api/v1/orders/{id}"] = {
    "get": {
        "tags": ["5. Orders & Deposit Checkout"],
        "summary": "Get Detailed Order Information",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Returns full order summary, breakdown of prices, payment transactions, and loan application status.",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
            "200": { "description": "Order details retrieved" },
            "403": { "description": "Forbidden if accessing another customer's order" },
            "404": { "description": "Order not found" }
        }
    }
}

paths["/api/v1/orders/{id}/send-paylink"] = {
    "post": {
        "tags": ["5. Orders & Deposit Checkout"],
        "summary": "Send PayLink to Customer (SALE / MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Dispatches a payment link notification to the buyer's phone/email for pending order payments.",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
            "200": { "description": "Payment link sent" },
            "403": { "description": "Forbidden for CUSTOMER role" }
        }
    }
}

# 6. PAYMENTS
paths["/api/v1/payments/stream"] = {
    "get": {
        "tags": ["6. Payments & Sandbox Webhooks"],
        "summary": "Real-Time Payment Status Stream (SSE)",
        "description": "Server-Sent Events stream for checkout UI. Streams live updates (`CONNECTED`, `PENDING`, `SUCCESS`, `FAILED`, `TIMEOUT`).",
        "parameters": [
            { "name": "orderId", "in": "query", "required": True, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
            "200": {
                "description": "text/event-stream active subscription",
                "content": { "text/event-stream": {} }
            },
            "400": { "description": "orderId parameter is required" }
        }
    }
}

paths["/api/v1/payments/mock-webhook"] = {
    "post": {
        "tags": ["6. Payments & Sandbox Webhooks"],
        "summary": "Simulate Payment Gateway Webhook (Sandbox QA Tool)",
        "description": """**Primary QA Testing Tool for Payment Transitions:**
Simulates payment gateway callbacks (VNPay / Napas / MoMo).
- `SUCCESS`: Updates payment to `SUCCESS`, order to `DEPOSIT_PAID`.
- `PARTIAL_PAID`: Deposits partial amount, credits difference to Customer Credit Ledger, keeps order in `PENDING_PAYMENT`.
- `FAILED`: Releases soft-locked quota (`soft_locked_count - 1`), updates order to `PAYMENT_FAILED`.
- `EXPIRED`: Releases quota, marks order `CANCELED`.""",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["result"],
                        "properties": {
                            "orderId": { "type": "string", "format": "uuid", "description": "Order UUID (or supply transactionRef)" },
                            "transactionRef": { "type": "string", "example": "TXN-1725494400-abcd1234" },
                            "result": { "type": "string", "enum": ["SUCCESS", "PARTIAL_PAID", "FAILED", "EXPIRED"], "example": "SUCCESS" },
                            "receivedAmount": { "type": "number", "example": 50000000, "description": "Optional: override amount received" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Webhook processed successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "data": {
                                "paymentStatus": "SUCCESS",
                                "orderStatus": "DEPOSIT_PAID",
                                "receivedAmount": 50000000
                            }
                        }
                    }
                }
            },
            "400": { "description": "Missing transactionRef/orderId or invalid result" },
            "404": { "description": "Payment not found" }
        }
    }
}

# 7. LOANS
paths["/api/v1/loans/{id}/switch-bank"] = {
    "post": {
        "tags": ["7. Loans & Banking Simulator"],
        "summary": "Switch Loan Partner Bank",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Transfers installment loan application to a different partner bank. Max 3 switches permitted per order (`ERR_UI_051`).",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" }, "description": "Loan Application UUID" }
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["bankCode"],
                        "properties": {
                            "bankCode": { "type": "string", "enum": ["TECHCOMBANK", "VPBANK", "VIB", "SHINHAN"], "example": "TECHCOMBANK" },
                            "reason": { "type": "string", "example": "Lãi suất ưu đãi hơn" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Bank switch initiated, status set to BANK_APPROVING" },
            "400": { "description": "ERR_UI_051: Exceeded maximum allowed bank switches (limit 3)" },
            "404": { "description": "Loan application not found" }
        }
    }
}

paths["/api/v1/mock/bank-decision"] = {
    "post": {
        "tags": ["7. Loans & Banking Simulator"],
        "summary": "Simulate Bank Credit Underwriting Decision (Sandbox QA)",
        "description": "Simulates automated credit approval callback from partner banks. Updates loan status to `APPROVED`, `PARTIALLY_APPROVED`, or `REJECTED`.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["loanId", "decision"],
                        "properties": {
                            "loanId": { "type": "string", "format": "uuid" },
                            "decision": { "type": "string", "enum": ["APPROVED", "PARTIALLY_APPROVED", "REJECTED"], "example": "APPROVED" },
                            "approvedAmount": { "type": "string", "example": "800000000" },
                            "interestRate": { "type": "string", "example": "7.9" },
                            "termMonths": { "type": "integer", "example": 84 },
                            "rejectionReason": { "type": "string", "example": "Thu nhập chưa đáp ứng chuẩn DTI" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Bank decision recorded and order status updated" }
        }
    }
}

# 8. TRADE-IN
paths["/api/v1/trade-in/submit"] = {
    "post": {
        "tags": ["8. Trade-In Vehicle Exchange"],
        "summary": "Submit Used Car Trade-In Valuation Request",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Customer submits their current used car for trade-in evaluation toward a new vehicle purchase.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["oldCarBrand", "oldCarModel", "manufacturingYear", "odoKm", "expectedPrice"],
                        "properties": {
                            "oldCarBrand": { "type": "string", "example": "Toyota" },
                            "oldCarModel": { "type": "string", "example": "Vios 1.5G CVT" },
                            "manufacturingYear": { "type": "integer", "example": 2020 },
                            "odoKm": { "type": "integer", "example": 45000 },
                            "expectedPrice": { "type": "number", "example": 460000000 },
                            "orderId": { "type": "string", "format": "uuid", "nullable": True }
                        }
                    }
                }
            }
        },
        "responses": {
            "201": { "description": "Trade-in request created with status SUBMITTED" },
            "400": { "description": "ERR_UI_060: Missing required fields" }
        }
    }
}

paths["/api/v1/trade-in/{id}/status"] = {
    "patch": {
        "tags": ["8. Trade-In Vehicle Exchange"],
        "summary": "Transition Trade-In Appraisal Status (SALE / MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": """**Strict State Machine Enforcement:**
- `SUBMITTED` -> `APPRAISING`, `REJECTED`
- `APPRAISING` -> `OFFERED`, `INSPECTION_FAILED`
- `OFFERED` -> `ACCEPTED`, `REJECTED`
- `ACCEPTED` -> `CONTRACT_SIGNED`
- `CONTRACT_SIGNED` -> `CREDITED_TO_ORDER`
Any invalid state transition triggers `ERR_UI_090`.""",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["status"],
                        "properties": {
                            "status": { "type": "string", "enum": ["APPRAISING", "OFFERED", "ACCEPTED", "REJECTED", "INSPECTION_FAILED", "CONTRACT_SIGNED", "CREDITED_TO_ORDER"] },
                            "appraisedPrice": { "type": "number", "example": 450000000 },
                            "finalTradeInValue": { "type": "number", "example": 445000000 }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Trade-in status transitioned successfully and audit logged" },
            "400": { "description": "ERR_UI_090: Chuyển trạng thái vi phạm State Machine" },
            "403": { "description": "Forbidden for CUSTOMER role" }
        }
    }
}

# 9. REFUNDS
paths["/api/v1/refunds/request"] = {
    "post": {
        "tags": ["9. Refunds Management"],
        "summary": "Submit Deposit Refund Request",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": """Requests deposit refund (e.g. buyer failed bank loan or withdrawn).
If reason is loan rejection, `bankRejectionProofUrl` is mandatory (`ERR_UI_070`).
Initial status is set to `PENDING_MANAGER`.""",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["orderId", "bankAccountNumber", "bankName", "accountHolderName", "reason"],
                        "properties": {
                            "orderId": { "type": "string", "format": "uuid" },
                            "bankAccountNumber": { "type": "string", "example": "19034567890012" },
                            "bankName": { "type": "string", "example": "Techcombank" },
                            "accountHolderName": { "type": "string", "example": "NGUYEN VAN TUAN" },
                            "reason": { "type": "string", "example": "Ngân hàng từ chối cho vay gói ưu đãi" },
                            "bankRejectionProofUrl": { "type": "string", "example": "https://storage.autodealer.vn/proofs/bank-reject-01.pdf" }
                        }
                    }
                }
            }
        },
        "responses": {
            "201": { "description": "Refund request created in PENDING_MANAGER status" },
            "400": { "description": "ERR_UI_060 (Missing fields), ERR_UI_070 (Missing bank rejection proof), or ERR_UI_071 (Already processed)" }
        }
    }
}

paths["/api/v1/refunds/{id}/decision"] = {
    "post": {
        "tags": ["9. Refunds Management"],
        "summary": "Two-Tier Refund Approval Decision (MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": """**Two-Tier Governance Approval Workflow:**
1. **Showroom MANAGER**: Can approve `PENDING_MANAGER` -> `PENDING_ADMIN`, or mark `REJECTED`.
2. **Super ADMIN**: Can approve `PENDING_ADMIN` -> `COMPLETED`, which updates the Order status to `REFUNDED`. Or mark `REJECTED`.""",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["decision"],
                        "properties": {
                            "decision": { "type": "string", "enum": ["APPROVED", "REJECTED"], "example": "APPROVED" },
                            "managerOverrideReason": { "type": "string", "example": "Đã đối chiếu chứng từ ngân hàng hợp lệ" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Refund decision applied and audit trail created" },
            "400": { "description": "Invalid decision or status not ready for this tier" },
            "403": { "description": "Forbidden for unauthorized roles" }
        }
    }
}

# 10. INVENTORY
paths["/api/v1/inventory/vehicles"] = {
    "get": {
        "tags": ["10. Inventory & Fleet Operations"],
        "summary": "Query Physical Vehicles & VINs (SALE / MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Lists vehicle chassis with individual VIN numbers, engine numbers, manufacturing dates, and status. Sales consultants only see vehicles in their showroom.",
        "parameters": [
            { "name": "showroom_id", "in": "query", "schema": { "type": "string", "format": "uuid" } },
            { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["AVAILABLE", "RESERVED", "DELIVERED", "LOCKED", "TRANSFERRING", "TRANSIT_DAMAGED"] } }
        ],
        "responses": {
            "200": { "description": "List of physical vehicles" },
            "403": { "description": "Forbidden" }
        }
    }
}

paths["/api/v1/inventory/manual-vin-hold"] = {
    "post": {
        "tags": ["10. Inventory & Fleet Operations"],
        "summary": "Manual 24h VIN Hold Reservation (MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Manually locks a specific VIN unit for 24 hours (e.g. VIP client booking or transfer priority). Status changes to `LOCKED`.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["vehicleId", "reason"],
                        "properties": {
                            "vehicleId": { "type": "string", "format": "uuid" },
                            "reason": { "type": "string", "example": "Khách hàng VIP giữ xe 24h chờ duyệt tài chính" },
                            "customerId": { "type": "string", "format": "uuid", "nullable": True }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "VIN held successfully for 24h" },
            "409": { "description": "ERR_UI_080: VIN not available for hold or has existing active lock" }
        }
    }
}

paths["/api/v1/inventory/transfers"] = {
    "get": {
        "tags": ["10. Inventory & Fleet Operations"],
        "summary": "List Inter-Showroom Vehicle Transfers (MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Lists vehicle dispatch logistics between showrooms.",
        "responses": { "200": { "description": "List of transfers" } }
    },
    "post": {
        "tags": ["10. Inventory & Fleet Operations"],
        "summary": "Initiate Inter-Showroom Vehicle Transfer",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Dispatches a car from one showroom to another. Vehicle status changes to `TRANSFERRING`.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["vehicleId", "fromShowroomId", "toShowroomId"],
                        "properties": {
                            "vehicleId": { "type": "string", "format": "uuid" },
                            "fromShowroomId": { "type": "string", "format": "uuid" },
                            "toShowroomId": { "type": "string", "format": "uuid" },
                            "notes": { "type": "string", "example": "Điều chuyển xe lái thử cho triển lãm cuối tuần" }
                        }
                    }
                }
            }
        },
        "responses": {
            "201": { "description": "Transfer initiated" },
            "400": { "description": "Invalid vehicle or showroom" }
        }
    }
}

paths["/api/v1/inventory/transfers/{id}/damage-report"] = {
    "post": {
        "tags": ["10. Inventory & Fleet Operations"],
        "summary": "Report Logistics Transit Damage (MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Records vehicle damage encountered during inter-showroom transit. Vehicle status updated to `TRANSIT_DAMAGED`.",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" }, "description": "Transfer UUID" }
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["damageSeverity", "damageDescription"],
                        "properties": {
                            "damageSeverity": { "type": "string", "enum": ["MINOR", "MODERATE", "SEVERE"], "example": "MINOR" },
                            "damageDescription": { "type": "string", "example": "Xước cản trước 15cm trong quá trình hạ lồng vận chuyển" },
                            "photoUrls": { "type": "array", "items": { "type": "string" }, "example": ["https://storage.autodealer.vn/damages/damage-front.jpg"] }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Damage reported and vehicle quarantined as TRANSIT_DAMAGED" }
        }
    }
}

# 11. CRM
paths["/api/v1/crm/leads"] = {
    "get": {
        "tags": ["11. CRM & Lead Pipeline"],
        "summary": "List Customer Leads (SALE / MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Fetches prospective buyer leads. Sales consultants only see leads assigned to them.",
        "parameters": [
            { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["NEW", "CONTACTED", "TEST_DRIVE", "NEGOTIATING", "WON", "LOST"] } },
            { "name": "search", "in": "query", "schema": { "type": "string" } }
        ],
        "responses": { "200": { "description": "List of leads" } }
    },
    "post": {
        "tags": ["11. CRM & Lead Pipeline"],
        "summary": "Create Prospective Lead (SALE / MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Records a new customer inquiry.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["fullName", "phone"],
                        "properties": {
                            "fullName": { "type": "string", "example": "Trần Hải Đăng" },
                            "phone": { "type": "string", "example": "0988112233" },
                            "email": { "type": "string", "example": "haidang@gmail.com" },
                            "interestedVariantId": { "type": "string", "format": "uuid", "nullable": True },
                            "notes": { "type": "string", "example": "Quan tâm trả góp 80% Ford Everest Titanium" }
                        }
                    }
                }
            }
        },
        "responses": { "201": { "description": "Lead created" } }
    }
}

paths["/api/v1/crm/leads/{id}/status"] = {
    "patch": {
        "tags": ["11. CRM & Lead Pipeline"],
        "summary": "Update Lead Stage & Pipeline Machine (SALE / MANAGER / ADMIN)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Transitions CRM lead stage. When marking `LOST`, `lossReason` is strictly mandatory (`ERR_UI_090`).",
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["status"],
                        "properties": {
                            "status": { "type": "string", "enum": ["NEW", "CONTACTED", "TEST_DRIVE", "NEGOTIATING", "WON", "LOST"], "example": "TEST_DRIVE" },
                            "lossReason": { "type": "string", "example": "Khách chọn mua xe khác do cần giao ngay" },
                            "notes": { "type": "string", "example": "Đã hoàn thành buổi lái thử, khách rất ưng ý cảm giác lái" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Lead status updated" },
            "400": { "description": "ERR_UI_090: Missing lossReason or illegal transition" }
        }
    }
}

# 12. ADMIN & AUDITING
paths["/api/v1/admin/users"] = {
    "get": {
        "tags": ["12. Admin & System Governance"],
        "summary": "List System Users & Roles (ADMIN Only)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Lists all accounts across system roles (ADMIN, MANAGER, SALE, CUSTOMER).",
        "responses": {
            "200": { "description": "List of users" },
            "403": { "description": "Forbidden for non-admin users" }
        }
    },
    "post": {
        "tags": ["12. Admin & System Governance"],
        "summary": "Provision Staff / Employee Account (ADMIN Only)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Provisions a new employee account (MANAGER or SALE) tied to a specific showroom.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["fullName", "email", "phone", "role", "password"],
                        "properties": {
                            "fullName": { "type": "string", "example": "Đặng Quốc Hưng" },
                            "email": { "type": "string", "example": "hung.dq@autodealer.vn" },
                            "phone": { "type": "string", "example": "0901122334" },
                            "role": { "type": "string", "enum": ["ADMIN", "MANAGER", "SALE", "CUSTOMER"], "example": "SALE" },
                            "showroomId": { "type": "string", "format": "uuid" },
                            "password": { "type": "string", "example": "Admin@123" }
                        }
                    }
                }
            }
        },
        "responses": { "201": { "description": "Staff account provisioned" } }
    }
}

paths["/api/v1/admin/users/{id}"] = {
    "put": {
        "tags": ["12. Admin & System Governance"],
        "summary": "Update User Role or Status (ADMIN Only)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "parameters": [
            { "name": "id", "in": "path", "required": True, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "role": { "type": "string", "enum": ["ADMIN", "MANAGER", "SALE", "CUSTOMER"] },
                            "showroomId": { "type": "string", "format": "uuid" },
                            "isActive": { "type": "boolean" }
                        }
                    }
                }
            }
        },
        "responses": { "200": { "description": "User updated" } }
    }
}

paths["/api/v1/system/configs"] = {
    "get": {
        "tags": ["12. Admin & System Governance"],
        "summary": "Get Global System Parameters & Discount Ceilings (ADMIN Only)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Returns soft-lock timeout (3m), deposit SLA, and role discount ceilings (Manager 5%, Admin 10%).",
        "responses": { "200": { "description": "System configuration constants" } }
    },
    "put": {
        "tags": ["12. Admin & System Governance"],
        "summary": "Update Discount Policy Ceilings (ADMIN Only)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Updates max discount cap. Validates that maxDiscountPercentage cannot exceed hard limit 10.00% (`ERR_UI_100`).",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["policyId"],
                        "properties": {
                            "policyId": { "type": "string", "format": "uuid" },
                            "maxDiscountPercentage": { "type": "string", "example": "8.50" },
                            "maxDiscountAmount": { "type": "string", "example": "80000000" },
                            "isActive": { "type": "boolean" }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": { "description": "Policy updated and audit log recorded" },
            "400": { "description": "ERR_UI_100: Chiết khấu vượt quá 10%" },
            "403": { "description": "ERR_UI_101: Forbidden" }
        }
    }
}

paths["/api/v1/audit/logs"] = {
    "get": {
        "tags": ["12. Admin & System Governance"],
        "summary": "Query Immutable Audit Logs (ADMIN Only)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Returns paginated audit trail of all security, financial, and inventory changes with correlation ID, IP, and actor.",
        "parameters": [
            { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
            { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } },
            { "name": "action", "in": "query", "schema": { "type": "string" }, "description": "e.g. UPDATE_SYSTEM_CONFIG, DECRYPT_PII, REFUND_APPROVED" },
            { "name": "entityType", "in": "query", "schema": { "type": "string" } },
            { "name": "correlationId", "in": "query", "schema": { "type": "string" } },
            { "name": "dateFrom", "in": "query", "schema": { "type": "string", "format": "date" } },
            { "name": "dateTo", "in": "query", "schema": { "type": "string", "format": "date" } }
        ],
        "responses": { "200": { "description": "Paginated audit logs" } }
    }
}

paths["/api/v1/audit/decrypt-pii"] = {
    "post": {
        "tags": ["12. Admin & System Governance"],
        "summary": "High-Security Decrypt Customer CCCD PII (Super ADMIN Only)",
        "security": [{ "sessionAuth": [] }, { "bearerAuth": [] }],
        "description": "Decrypts customer's raw 12-digit Citizen Identity Card (CCCD) from AES-256-GCM ciphertext. Mandatory security audit entry is logged.",
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["userId"],
                        "properties": {
                            "userId": { "type": "string", "format": "uuid" },
                            "fields": { "type": "array", "items": { "type": "string" }, "example": ["identityCardNumber"] }
                        }
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Decrypted PII returned",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "data": { "identityCardNumber": "001200001234" }
                        }
                    }
                }
            },
            "403": { "description": "ERR_UI_101: Không có quyền decrypt PII" }
        }
    }
}

# Write openapi.json
os.makedirs("public", exist_ok=True)
with open("public/openapi.json", "w", encoding="utf-8") as f:
    json.dump(openapi_spec, f, ensure_ascii=False, indent=2)

print(f"Generated public/openapi.json with {len(paths)} endpoints.")
