CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`whatsapp` text,
	`phone` text,
	`email` text,
	`address_zip` text,
	`address_street` text,
	`address_number` text,
	`address_complement` text,
	`address_district` text,
	`address_city` text,
	`address_state` text,
	`is_default` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_tenant_slug_unique` ON `stores` (`tenant_id`,`slug`);--> statement-breakpoint
CREATE INDEX `stores_tenant_active_idx` ON `stores` (`tenant_id`,`active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'open' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pipeline_stages_tenant_idx` ON `pipeline_stages` (`tenant_id`,`position`);--> statement-breakpoint
CREATE TABLE `lead_events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`lead_id` text NOT NULL,
	`type` text DEFAULT 'note' NOT NULL,
	`body` text,
	`user_id` text,
	`user_name` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `lead_events_lead_idx` ON `lead_events` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lead_routing` (
	`tenant_id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'off' NOT NULL,
	`last_assigned_user_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`last_assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `financings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`lead_id` text,
	`vehicle_id` text,
	`vehicle_label` text,
	`customer_name` text NOT NULL,
	`customer_document` text,
	`customer_phone` text,
	`bank` text,
	`vehicle_price_cents` integer DEFAULT 0 NOT NULL,
	`down_payment_cents` integer DEFAULT 0 NOT NULL,
	`financed_cents` integer DEFAULT 0 NOT NULL,
	`installments` integer DEFAULT 0 NOT NULL,
	`installment_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`notes` text,
	`store_id` text,
	`created_by_user_id` text,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `financings_tenant_status_idx` ON `financings` (`tenant_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `financings_lead_idx` ON `financings` (`lead_id`);--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`prefix` text NOT NULL,
	`key_hash` text NOT NULL,
	`created_by_user_id` text,
	`last_used_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE INDEX `api_keys_tenant_idx` ON `api_keys` (`tenant_id`,`revoked_at`);--> statement-breakpoint
CREATE TABLE `tenant_webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`url` text NOT NULL,
	`secret` text NOT NULL,
	`events` text,
	`active` integer DEFAULT true NOT NULL,
	`last_status` integer,
	`last_error` text,
	`last_attempt_at` integer,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tenant_webhooks_tenant_idx` ON `tenant_webhooks` (`tenant_id`,`active`);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `store_id` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `stage_id` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `store_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `store_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `receives_leads` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `permission_overrides` text;--> statement-breakpoint
CREATE INDEX `vehicles_store_idx` ON `vehicles` (`tenant_id`,`store_id`);--> statement-breakpoint
CREATE INDEX `leads_stage_idx` ON `leads` (`tenant_id`,`stage_id`);
