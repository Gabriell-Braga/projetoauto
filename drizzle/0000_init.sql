CREATE TABLE `tenant_banners` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`image_key` text NOT NULL,
	`image_key_mobile` text,
	`title` text,
	`subtitle` text,
	`cta_label` text,
	`cta_href` text,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tenant_banners_tenant_idx` ON `tenant_banners` (`tenant_id`,`position`);--> statement-breakpoint
CREATE TABLE `tenant_sites` (
	`tenant_id` text PRIMARY KEY NOT NULL,
	`logo_key` text,
	`favicon_key` text,
	`theme` text,
	`gtm_code` text,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`address_street` text,
	`address_number` text,
	`address_complement` text,
	`address_district` text,
	`address_city` text,
	`address_state` text,
	`address_zip` text,
	`maps_url` text,
	`business_hours` text,
	`social` text,
	`about_title` text,
	`about_text` text,
	`seo` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`legal_name` text,
	`cnpj` text,
	`status` text DEFAULT 'active' NOT NULL,
	`template_id` text DEFAULT 'template-1-clean' NOT NULL,
	`block_mode` text DEFAULT 'readonly' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE INDEX `tenants_status_idx` ON `tenants` (`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`must_change_password` integer DEFAULT false NOT NULL,
	`sessions_valid_from` integer NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`tenant_id`,`status`);--> statement-breakpoint
CREATE TABLE `billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`type` text NOT NULL,
	`amount_cents` integer,
	`reference_month` text,
	`status_from` text,
	`status_to` text,
	`note` text,
	`created_by_user_id` text,
	`created_by_email` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `billing_events_tenant_idx` ON `billing_events` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `billing_status` (
	`tenant_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'adimplente' NOT NULL,
	`due_day` integer DEFAULT 10 NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`current_due_date` integer,
	`last_payment_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `billing_status_status_idx` ON `billing_status` (`status`);--> statement-breakpoint
CREATE TABLE `vehicle_brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_by_tenant_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_brands_slug_unique` ON `vehicle_brands` (`slug`);--> statement-breakpoint
CREATE TABLE `vehicle_models` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_by_tenant_id` text,
	FOREIGN KEY (`brand_id`) REFERENCES `vehicle_brands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_models_brand_slug_unique` ON `vehicle_models` (`brand_id`,`slug`);--> statement-breakpoint
CREATE TABLE `vehicle_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`variants` text NOT NULL,
	`width` integer,
	`height` integer,
	`size_bytes` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vehicle_photos_vehicle_idx` ON `vehicle_photos` (`vehicle_id`,`position`);--> statement-breakpoint
CREATE INDEX `vehicle_photos_tenant_idx` ON `vehicle_photos` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`slug` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`version` text,
	`year_manufacture` integer NOT NULL,
	`year_model` integer NOT NULL,
	`mileage_km` integer DEFAULT 0 NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`price_on_request` integer DEFAULT false NOT NULL,
	`transmission` text,
	`fuel` text,
	`body_type` text,
	`color` text,
	`doors` integer,
	`license_plate_end` text,
	`options` text,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`cover_photo_key` text,
	`photos_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_tenant_slug_unique` ON `vehicles` (`tenant_id`,`slug`);--> statement-breakpoint
CREATE INDEX `vehicles_tenant_status_idx` ON `vehicles` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `vehicles_tenant_featured_idx` ON `vehicles` (`tenant_id`,`featured`,`status`);--> statement-breakpoint
CREATE INDEX `vehicles_tenant_brand_idx` ON `vehicles` (`tenant_id`,`brand`,`model`);--> statement-breakpoint
CREATE INDEX `vehicles_tenant_price_idx` ON `vehicles` (`tenant_id`,`price_cents`);--> statement-breakpoint
CREATE INDEX `vehicles_tenant_created_idx` ON `vehicles` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`vehicle_id` text,
	`vehicle_label` text,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`message` text,
	`source` text DEFAULT 'form' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`assigned_to_user_id` text,
	`internal_notes` text,
	`utm` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `leads_tenant_status_idx` ON `leads` (`tenant_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `leads_tenant_created_idx` ON `leads` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `leads_vehicle_idx` ON `leads` (`vehicle_id`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`actor_email` text,
	`actor_role` text,
	`impersonated` integer DEFAULT false NOT NULL,
	`tenant_id` text,
	`action` text NOT NULL,
	`entity` text,
	`entity_id` text,
	`metadata` text,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_log_tenant_idx` ON `audit_log` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_actor_idx` ON `audit_log` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);