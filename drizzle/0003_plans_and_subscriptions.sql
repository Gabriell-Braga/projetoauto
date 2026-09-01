CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`discount_type` text DEFAULT 'PERCENTAGE' NOT NULL,
	`discount_value` integer NOT NULL,
	`duration_cycles` integer,
	`max_redemptions` integer,
	`redemptions` integer DEFAULT 0 NOT NULL,
	`plan_ids` text,
	`expires_at` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`cycle` text DEFAULT 'MONTHLY' NOT NULL,
	`billing_mode` text DEFAULT 'gateway' NOT NULL,
	`trial_days` integer DEFAULT 0 NOT NULL,
	`limits` text,
	`features` text,
	`public_visible` integer DEFAULT true NOT NULL,
	`highlighted` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plans_slug_unique` ON `plans` (`slug`);--> statement-breakpoint
CREATE INDEX `plans_active_idx` ON `plans` (`active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`fine_percent` integer DEFAULT 2 NOT NULL,
	`interest_percent` integer DEFAULT 1 NOT NULL,
	`default_trial_days` integer DEFAULT 0 NOT NULL,
	`gateway_notifications` integer DEFAULT true NOT NULL,
	`default_grace_days` integer DEFAULT 5 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`plan_id` text,
	`status` text DEFAULT 'manual' NOT NULL,
	`billing_type` text DEFAULT 'UNDEFINED' NOT NULL,
	`gateway_customer_id` text,
	`gateway_subscription_id` text,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`coupon_code` text,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`trial_ends_at` integer,
	`current_period_end` integer,
	`canceled_at` integer,
	`last_event_type` text,
	`last_event_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_tenant_unique` ON `subscriptions` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_gateway_idx` ON `subscriptions` (`gateway_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_customer_idx` ON `subscriptions` (`gateway_customer_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'asaas' NOT NULL,
	`event_type` text NOT NULL,
	`tenant_id` text,
	`payload` text,
	`processed_at` integer,
	`error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `webhook_events_received_idx` ON `webhook_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `webhook_events_tenant_idx` ON `webhook_events` (`tenant_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `tenants` ADD `plan_id` text;