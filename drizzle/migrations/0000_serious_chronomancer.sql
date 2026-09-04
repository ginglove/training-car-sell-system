CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'SALE', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_type" AS ENUM('CREDIT_DEPOSIT_OVERPAY', 'CREDIT_PARTIAL_EXPIRED', 'CREDIT_REFUND', 'DEBIT_APPLIED_TO_ORDER');--> statement-breakpoint
CREATE TYPE "public"."origin_type" AS ENUM('CKD', 'CBU');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('AVAILABLE', 'LOCKED', 'RESERVED', 'SOLD', 'TRANSFERRING');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('USER', 'SYSTEM', 'PAYMENT_GATEWAY', 'SCHEDULER');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING_PAYMENT', 'PAYMENT_FAILED', 'DEPOSIT_PAID', 'BANK_APPROVING', 'BANK_APPROVED', 'BANK_PARTIALLY_APPROVED', 'BANK_REJECTED', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'REFUND_REQUESTED', 'REFUNDED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."purchase_type" AS ENUM('DIRECT', 'AUTO_LOAN');--> statement-breakpoint
CREATE TYPE "public"."registration_sub_status" AS ENUM('REGISTRATION_PENDING', 'PLATE_ASSIGNED', 'PDI_COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('MOCK_GATEWAY', 'MOCK_VIETQR', 'MOCK_VNPAY', 'POS_SHOWROOM');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('PENDING', 'PROCESSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PARTIAL_PAID', 'SUCCESS', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."discount_approval_status" AS ENUM('PENDING_MANAGER', 'PENDING_ADMIN', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."trade_in_status" AS ENUM('SUBMITTED', 'APPRAISING', 'OFFERED', 'ACCEPTED', 'CONTRACT_SIGNED', 'CREDITED_TO_ORDER', 'INSPECTION_FAILED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."refund_reason_type" AS ENUM('BANK_LOAN_REJECTED', 'SYSTEM_TIMEOUT_ERROR', 'FORCE_MAJEURE');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('DRAFT', 'PENDING_MANAGER', 'PENDING_ADMIN', 'COMPLETED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'TRANSIT_DAMAGED', 'REJECTED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'TEST_DRIVE_BOOKED', 'NEGOTIATING', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'SMS_BRANDNAME', 'ZALO_ZNS', 'EMAIL');--> statement-breakpoint
CREATE TABLE "showrooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(30) NOT NULL,
	"address" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "showrooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(15) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"showroom_id" uuid,
	"is_active" boolean DEFAULT true,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"identity_card_number" varchar(255) NOT NULL,
	"identity_card_masked" varchar(20) NOT NULL,
	"identity_card_date" date NOT NULL,
	"identity_card_place" varchar(150) NOT NULL,
	"permanent_address" text NOT NULL,
	"monthly_income" numeric(15, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"order_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"type" "credit_transaction_type" NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "credit_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "customer_credit_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'VND',
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customer_credit_accounts_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"logo_url" text NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"body_type" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_price_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"old_listed_price" numeric(15, 2) NOT NULL,
	"new_listed_price" numeric(15, 2) NOT NULL,
	"changed_by" uuid NOT NULL,
	"effective_date" timestamp with time zone DEFAULT now(),
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "vehicle_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"variant_name" varchar(100) NOT NULL,
	"listed_price" numeric(15, 2) NOT NULL,
	"min_deposit_amount" numeric(15, 2) NOT NULL,
	"specs_json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"is_thumbnail" boolean DEFAULT false,
	"is_360_asset" boolean DEFAULT false,
	"angle_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "vehicle_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"color" varchar(50) NOT NULL,
	"showroom_id" uuid NOT NULL,
	"total_physical_count" integer DEFAULT 0 NOT NULL,
	"soft_locked_count" integer DEFAULT 0 NOT NULL,
	"available_quota" integer GENERATED ALWAYS AS (total_physical_count - soft_locked_count) STORED,
	CONSTRAINT "unique_variant_color_showroom" UNIQUE("variant_id","color","showroom_id")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"vin_number" varchar(17) PRIMARY KEY NOT NULL,
	"engine_number" varchar(30) NOT NULL,
	"variant_id" uuid NOT NULL,
	"color" varchar(50) NOT NULL,
	"manufacturing_year" integer DEFAULT 2026 NOT NULL,
	"origin_type" "origin_type" DEFAULT 'CKD' NOT NULL,
	"showroom_id" uuid NOT NULL,
	"reserved_for_phone" varchar(15),
	"status" "vehicle_status" NOT NULL,
	"locked_until" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vehicles_engine_number_unique" UNIQUE("engine_number")
);
--> statement-breakpoint
CREATE TABLE "vin_hold_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_number" varchar(17) NOT NULL,
	"held_by_manager_id" uuid NOT NULL,
	"customer_phone" varchar(15) NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"order_id" uuid,
	"hold_reason" text NOT NULL,
	"hold_expires_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vin_hold_reservations_vin_number_unique" UNIQUE("vin_number")
);
--> statement-breakpoint
CREATE TABLE "order_accessories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"item_name" varchar(150) NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"old_status" varchar(30),
	"new_status" varchar(30) NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_user_id" uuid,
	"correlation_id" varchar(100),
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" varchar(30) NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"customer_id" uuid NOT NULL,
	"sale_id" uuid,
	"variant_id" uuid NOT NULL,
	"selected_color" varchar(50) NOT NULL,
	"showroom_id" uuid NOT NULL,
	"vin_number" varchar(17),
	"purchase_type" "purchase_type" DEFAULT 'DIRECT' NOT NULL,
	"deposit_amount" numeric(15, 2) NOT NULL,
	"total_listed_price" numeric(15, 2) NOT NULL,
	"accessories_total_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"insurance_total_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"trade_in_offset_id" uuid,
	"trade_in_credit_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"final_price" numeric(15, 2) NOT NULL,
	"applied_discount_request_id" uuid,
	"cancellation_reason" text,
	"cancelled_by" uuid,
	"registration_sub_status" "registration_sub_status",
	"status" "order_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_order_code_unique" UNIQUE("order_code"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" varchar(50) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'PENDING' NOT NULL,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"transaction_ref" varchar(100) NOT NULL,
	"gateway" "payment_gateway" DEFAULT 'MOCK_GATEWAY' NOT NULL,
	"snapshot_amount" numeric(15, 2) NOT NULL,
	"received_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'VND',
	"payment_status" "payment_status" NOT NULL,
	"gateway_transaction_no" varchar(100),
	"gateway_response_code" varchar(20),
	"gateway_bank_code" varchar(50),
	"gateway_pay_date" timestamp with time zone,
	"client_ip" varchar(45),
	"error_code" varchar(50),
	"needs_manual_refund" boolean DEFAULT false,
	"raw_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payments_transaction_ref_unique" UNIQUE("transaction_ref")
);
--> statement-breakpoint
CREATE TABLE "loan_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"switch_count" integer DEFAULT 0 NOT NULL,
	"requested_loan_amount" numeric(15, 2) NOT NULL,
	"approved_loan_amount" numeric(15, 2),
	"additional_cash_needed" numeric(15, 2) DEFAULT '0',
	"loan_term_months" integer NOT NULL,
	"interest_rate_percent" numeric(5, 2) NOT NULL,
	"has_co_borrower" boolean DEFAULT false,
	"co_borrower_name" varchar(100),
	"co_borrower_phone" varchar(15),
	"financial_documents_urls" text[],
	"status" "loan_status" NOT NULL,
	"approval_letter_url" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discount_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" varchar(20) NOT NULL,
	"max_discount_percentage" numeric(5, 2) NOT NULL,
	"max_discount_amount" numeric(15, 2) NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "discount_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"requested_by_sale" uuid NOT NULL,
	"assigned_approver_role" varchar(20) NOT NULL,
	"approved_by" uuid,
	"discount_amount" numeric(15, 2) NOT NULL,
	"reason" text NOT NULL,
	"manager_note" text,
	"voucher_code" varchar(50),
	"status" "discount_approval_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone,
	CONSTRAINT "discount_requests_voucher_code_unique" UNIQUE("voucher_code")
);
--> statement-breakpoint
CREATE TABLE "trade_in_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"customer_id" uuid NOT NULL,
	"assigned_appraiser_id" uuid,
	"old_car_brand" varchar(100) NOT NULL,
	"old_car_model" varchar(100) NOT NULL,
	"manufacturing_year" integer NOT NULL,
	"odo_km" integer NOT NULL,
	"expected_price" numeric(15, 2) NOT NULL,
	"appraised_price" numeric(15, 2),
	"final_trade_in_value" numeric(15, 2),
	"status" "trade_in_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "refund_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refund_code" varchar(30) NOT NULL,
	"order_id" uuid NOT NULL,
	"requested_by_sale" uuid NOT NULL,
	"confirmed_by_manager" uuid,
	"approved_by_admin" uuid,
	"refund_amount" numeric(15, 2) NOT NULL,
	"refund_reason_type" "refund_reason_type" NOT NULL,
	"bank_rejection_letter_url" text,
	"manager_override_reason" text,
	"bank_account_number" varchar(50) NOT NULL,
	"bank_account_name" varchar(100) NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"payout_due_date" date NOT NULL,
	"status" "refund_status" NOT NULL,
	"bank_transfer_slip_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	CONSTRAINT "refund_requests_refund_code_unique" UNIQUE("refund_code")
);
--> statement-breakpoint
CREATE TABLE "vehicle_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_code" varchar(30) NOT NULL,
	"vin_number" varchar(17) NOT NULL,
	"from_showroom_id" uuid NOT NULL,
	"to_showroom_id" uuid NOT NULL,
	"logistics_fee" numeric(15, 2) DEFAULT '0' NOT NULL,
	"transfer_transit_damage_notes" text,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"status" "transfer_status" NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	CONSTRAINT "vehicle_transfers_transfer_code_unique" UNIQUE("transfer_code")
);
--> statement-breakpoint
CREATE TABLE "test_drive_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"showroom_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"demo_vehicle_vin" varchar(17),
	"assigned_sale_id" uuid,
	"slot_start" timestamp with time zone NOT NULL,
	"slot_end" timestamp with time zone NOT NULL,
	"is_booked" boolean DEFAULT false,
	"customer_name" varchar(100),
	"customer_phone" varchar(15),
	"gplx_number" varchar(30),
	"gplx_image_url" varchar(255),
	"is_on_behalf" boolean DEFAULT false,
	"booked_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_drive_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"customer_user_id" uuid,
	"customer_name" varchar(100) NOT NULL,
	"customer_phone" varchar(15) NOT NULL,
	"driver_license" varchar(12),
	"is_on_behalf" boolean DEFAULT false,
	"on_behalf_customer_name" varchar(100),
	"on_behalf_customer_phone" varchar(15),
	"status" varchar(30) DEFAULT 'CONFIRMED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"phone" varchar(15) NOT NULL,
	"email" varchar(100),
	"interested_variant_id" uuid,
	"assigned_sale_id" uuid,
	"lead_status" "lead_status" NOT NULL,
	"lost_reason" text,
	"lead_score" integer DEFAULT 10,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"delivery_status" "delivery_status" DEFAULT 'PENDING',
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"query_filter" text,
	"decrypted_user_ids" uuid[],
	"ip_address" varchar(50),
	"user_agent" text,
	"correlation_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"config_value" text NOT NULL,
	"data_type" varchar(20) NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "system_configs_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false,
	"ip_requested" "inet",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" varchar(255) NOT NULL,
	"device_info" text,
	"ip" "inet",
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_sessions_refresh_token_hash_unique" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
CREATE TABLE "accessories_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"sku" varchar(50),
	"price" numeric(15, 2) NOT NULL,
	"category" varchar(100),
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "accessories_catalog_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "file_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"original_filename" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_showroom_id_showrooms_id_fk" FOREIGN KEY ("showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_account_id_customer_credit_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_credit_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_accounts" ADD CONSTRAINT "customer_credit_accounts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_price_histories" ADD CONSTRAINT "vehicle_price_histories_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_price_histories" ADD CONSTRAINT "vehicle_price_histories_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_variants" ADD CONSTRAINT "vehicle_variants_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_quotas" ADD CONSTRAINT "vehicle_quotas_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_quotas" ADD CONSTRAINT "vehicle_quotas_showroom_id_showrooms_id_fk" FOREIGN KEY ("showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_showroom_id_showrooms_id_fk" FOREIGN KEY ("showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vin_hold_reservations" ADD CONSTRAINT "vin_hold_reservations_vin_number_vehicles_vin_number_fk" FOREIGN KEY ("vin_number") REFERENCES "public"."vehicles"("vin_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vin_hold_reservations" ADD CONSTRAINT "vin_hold_reservations_held_by_manager_id_users_id_fk" FOREIGN KEY ("held_by_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_accessories" ADD CONSTRAINT "order_accessories_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_sale_id_users_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_showroom_id_showrooms_id_fk" FOREIGN KEY ("showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vin_number_vehicles_vin_number_fk" FOREIGN KEY ("vin_number") REFERENCES "public"."vehicles"("vin_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_trade_in_offset_id_trade_in_requests_id_fk" FOREIGN KEY ("trade_in_offset_id") REFERENCES "public"."trade_in_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_applied_discount_request_id_discount_requests_id_fk" FOREIGN KEY ("applied_discount_request_id") REFERENCES "public"."discount_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_requests" ADD CONSTRAINT "discount_requests_requested_by_sale_users_id_fk" FOREIGN KEY ("requested_by_sale") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_requests" ADD CONSTRAINT "discount_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_in_requests" ADD CONSTRAINT "trade_in_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_in_requests" ADD CONSTRAINT "trade_in_requests_assigned_appraiser_id_users_id_fk" FOREIGN KEY ("assigned_appraiser_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_requested_by_sale_users_id_fk" FOREIGN KEY ("requested_by_sale") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_confirmed_by_manager_users_id_fk" FOREIGN KEY ("confirmed_by_manager") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by_admin") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "vehicle_transfers_vin_number_vehicles_vin_number_fk" FOREIGN KEY ("vin_number") REFERENCES "public"."vehicles"("vin_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "vehicle_transfers_from_showroom_id_showrooms_id_fk" FOREIGN KEY ("from_showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "vehicle_transfers_to_showroom_id_showrooms_id_fk" FOREIGN KEY ("to_showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "vehicle_transfers_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "vehicle_transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_drive_slots" ADD CONSTRAINT "test_drive_slots_showroom_id_showrooms_id_fk" FOREIGN KEY ("showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_drive_slots" ADD CONSTRAINT "test_drive_slots_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_drive_bookings" ADD CONSTRAINT "test_drive_bookings_slot_id_test_drive_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."test_drive_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_drive_bookings" ADD CONSTRAINT "test_drive_bookings_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_interested_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("interested_variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assigned_sale_id_users_id_fk" FOREIGN KEY ("assigned_sale_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_available_cars" ON "vehicles" USING btree ("variant_id","color","showroom_id") WHERE status = 'AVAILABLE';--> statement-breakpoint
CREATE INDEX "idx_orders_customer_status" ON "orders" USING btree ("customer_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_pending_timeout" ON "orders" USING btree ("created_at") WHERE status = 'PENDING_PAYMENT';--> statement-breakpoint
CREATE INDEX "idx_outbox_pending" ON "outbox_events" USING btree ("status","created_at") WHERE status = 'PENDING';--> statement-breakpoint
CREATE INDEX "idx_payments_transaction_ref" ON "payments" USING btree ("transaction_ref","gateway") WHERE payment_status = 'PENDING';--> statement-breakpoint
CREATE INDEX "idx_leads_phone" ON "crm_leads" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_leads_sale" ON "crm_leads" USING btree ("assigned_sale_id");