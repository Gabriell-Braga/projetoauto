// ARQUIVO GERADO AUTOMATICAMENTE — não editar.
// Origem: drizzle/*.sql (rodar `npm run db:bundle`).

export type BundledMigration = { tag: string; statements: string[] };

export const MIGRATIONS: BundledMigration[] = [
  {
    "tag": "0000_init",
    "statements": [
      "CREATE TABLE `tenant_banners` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`image_key` text NOT NULL,\n\t`image_key_mobile` text,\n\t`title` text,\n\t`subtitle` text,\n\t`cta_label` text,\n\t`cta_href` text,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`active` integer DEFAULT true NOT NULL,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE INDEX `tenant_banners_tenant_idx` ON `tenant_banners` (`tenant_id`,`position`);",
      "CREATE TABLE `tenant_sites` (\n\t`tenant_id` text PRIMARY KEY NOT NULL,\n\t`logo_key` text,\n\t`favicon_key` text,\n\t`theme` text,\n\t`gtm_code` text,\n\t`phone` text,\n\t`whatsapp` text,\n\t`email` text,\n\t`address_street` text,\n\t`address_number` text,\n\t`address_complement` text,\n\t`address_district` text,\n\t`address_city` text,\n\t`address_state` text,\n\t`address_zip` text,\n\t`maps_url` text,\n\t`business_hours` text,\n\t`social` text,\n\t`about_title` text,\n\t`about_text` text,\n\t`seo` text,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE TABLE `tenants` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`slug` text NOT NULL,\n\t`name` text NOT NULL,\n\t`legal_name` text,\n\t`cnpj` text,\n\t`status` text DEFAULT 'active' NOT NULL,\n\t`template_id` text DEFAULT 'template-1-clean' NOT NULL,\n\t`block_mode` text DEFAULT 'readonly' NOT NULL,\n\t`notes` text,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\t`deleted_at` integer\n);",
      "CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);",
      "CREATE INDEX `tenants_status_idx` ON `tenants` (`status`);",
      "CREATE TABLE `users` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text,\n\t`email` text NOT NULL,\n\t`name` text NOT NULL,\n\t`password_hash` text NOT NULL,\n\t`password_salt` text NOT NULL,\n\t`role` text NOT NULL,\n\t`status` text DEFAULT 'active' NOT NULL,\n\t`must_change_password` integer DEFAULT false NOT NULL,\n\t`sessions_valid_from` integer NOT NULL,\n\t`last_login_at` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);",
      "CREATE INDEX `users_tenant_idx` ON `users` (`tenant_id`,`status`);",
      "CREATE TABLE `billing_events` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`type` text NOT NULL,\n\t`amount_cents` integer,\n\t`reference_month` text,\n\t`status_from` text,\n\t`status_to` text,\n\t`note` text,\n\t`created_by_user_id` text,\n\t`created_by_email` text,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE INDEX `billing_events_tenant_idx` ON `billing_events` (`tenant_id`,`created_at`);",
      "CREATE TABLE `billing_status` (\n\t`tenant_id` text PRIMARY KEY NOT NULL,\n\t`status` text DEFAULT 'adimplente' NOT NULL,\n\t`due_day` integer DEFAULT 10 NOT NULL,\n\t`amount_cents` integer DEFAULT 0 NOT NULL,\n\t`current_due_date` integer,\n\t`last_payment_at` integer,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE INDEX `billing_status_status_idx` ON `billing_status` (`status`);",
      "CREATE TABLE `vehicle_brands` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`slug` text NOT NULL,\n\t`created_by_tenant_id` text\n);",
      "CREATE UNIQUE INDEX `vehicle_brands_slug_unique` ON `vehicle_brands` (`slug`);",
      "CREATE TABLE `vehicle_models` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`brand_id` text NOT NULL,\n\t`name` text NOT NULL,\n\t`slug` text NOT NULL,\n\t`created_by_tenant_id` text,\n\tFOREIGN KEY (`brand_id`) REFERENCES `vehicle_brands`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE UNIQUE INDEX `vehicle_models_brand_slug_unique` ON `vehicle_models` (`brand_id`,`slug`);",
      "CREATE TABLE `vehicle_photos` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`vehicle_id` text NOT NULL,\n\t`variants` text NOT NULL,\n\t`width` integer,\n\t`height` integer,\n\t`size_bytes` integer,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`is_cover` integer DEFAULT false NOT NULL,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE INDEX `vehicle_photos_vehicle_idx` ON `vehicle_photos` (`vehicle_id`,`position`);",
      "CREATE INDEX `vehicle_photos_tenant_idx` ON `vehicle_photos` (`tenant_id`);",
      "CREATE TABLE `vehicles` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`slug` text NOT NULL,\n\t`brand` text NOT NULL,\n\t`model` text NOT NULL,\n\t`version` text,\n\t`year_manufacture` integer NOT NULL,\n\t`year_model` integer NOT NULL,\n\t`mileage_km` integer DEFAULT 0 NOT NULL,\n\t`price_cents` integer DEFAULT 0 NOT NULL,\n\t`price_on_request` integer DEFAULT false NOT NULL,\n\t`transmission` text,\n\t`fuel` text,\n\t`body_type` text,\n\t`color` text,\n\t`doors` integer,\n\t`license_plate_end` text,\n\t`options` text,\n\t`description` text,\n\t`status` text DEFAULT 'draft' NOT NULL,\n\t`featured` integer DEFAULT false NOT NULL,\n\t`sort_order` integer DEFAULT 0 NOT NULL,\n\t`views` integer DEFAULT 0 NOT NULL,\n\t`cover_photo_key` text,\n\t`photos_count` integer DEFAULT 0 NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE UNIQUE INDEX `vehicles_tenant_slug_unique` ON `vehicles` (`tenant_id`,`slug`);",
      "CREATE INDEX `vehicles_tenant_status_idx` ON `vehicles` (`tenant_id`,`status`);",
      "CREATE INDEX `vehicles_tenant_featured_idx` ON `vehicles` (`tenant_id`,`featured`,`status`);",
      "CREATE INDEX `vehicles_tenant_brand_idx` ON `vehicles` (`tenant_id`,`brand`,`model`);",
      "CREATE INDEX `vehicles_tenant_price_idx` ON `vehicles` (`tenant_id`,`price_cents`);",
      "CREATE INDEX `vehicles_tenant_created_idx` ON `vehicles` (`tenant_id`,`created_at`);",
      "CREATE TABLE `leads` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`vehicle_id` text,\n\t`vehicle_label` text,\n\t`name` text NOT NULL,\n\t`phone` text NOT NULL,\n\t`email` text,\n\t`message` text,\n\t`source` text DEFAULT 'form' NOT NULL,\n\t`status` text DEFAULT 'new' NOT NULL,\n\t`assigned_to_user_id` text,\n\t`internal_notes` text,\n\t`utm` text,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null,\n\tFOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null\n);",
      "CREATE INDEX `leads_tenant_status_idx` ON `leads` (`tenant_id`,`status`,`created_at`);",
      "CREATE INDEX `leads_tenant_created_idx` ON `leads` (`tenant_id`,`created_at`);",
      "CREATE INDEX `leads_vehicle_idx` ON `leads` (`vehicle_id`);",
      "CREATE TABLE `audit_log` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`actor_user_id` text,\n\t`actor_email` text,\n\t`actor_role` text,\n\t`impersonated` integer DEFAULT false NOT NULL,\n\t`tenant_id` text,\n\t`action` text NOT NULL,\n\t`entity` text,\n\t`entity_id` text,\n\t`metadata` text,\n\t`ip` text,\n\t`user_agent` text,\n\t`created_at` integer NOT NULL\n);",
      "CREATE INDEX `audit_log_tenant_idx` ON `audit_log` (`tenant_id`,`created_at`);",
      "CREATE INDEX `audit_log_actor_idx` ON `audit_log` (`actor_user_id`,`created_at`);",
      "CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);"
    ]
  },
  {
    "tag": "0001_tenant_gtm",
    "statements": [
      "ALTER TABLE `tenants` ADD `gtm_code` text;"
    ]
  },
  {
    "tag": "0002_grace_and_password_resets",
    "statements": [
      "CREATE TABLE `password_resets` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`user_id` text NOT NULL,\n\t`token_hash` text NOT NULL,\n\t`expires_at` integer NOT NULL,\n\t`used_at` integer,\n\t`delivered` integer DEFAULT false NOT NULL,\n\t`requested_ip` text,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE UNIQUE INDEX `password_resets_token_unique` ON `password_resets` (`token_hash`);",
      "CREATE INDEX `password_resets_user_idx` ON `password_resets` (`user_id`,`created_at`);",
      "CREATE INDEX `password_resets_expires_idx` ON `password_resets` (`expires_at`);",
      "ALTER TABLE `billing_status` ADD `grace_days` integer DEFAULT 5 NOT NULL;"
    ]
  },
  {
    "tag": "0003_plans_and_subscriptions",
    "statements": [
      "CREATE TABLE `coupons` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`code` text NOT NULL,\n\t`description` text,\n\t`discount_type` text DEFAULT 'PERCENTAGE' NOT NULL,\n\t`discount_value` integer NOT NULL,\n\t`duration_cycles` integer,\n\t`max_redemptions` integer,\n\t`redemptions` integer DEFAULT 0 NOT NULL,\n\t`plan_ids` text,\n\t`expires_at` integer,\n\t`active` integer DEFAULT true NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL\n);",
      "CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);",
      "CREATE TABLE `plans` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`slug` text NOT NULL,\n\t`description` text,\n\t`price_cents` integer DEFAULT 0 NOT NULL,\n\t`cycle` text DEFAULT 'MONTHLY' NOT NULL,\n\t`billing_mode` text DEFAULT 'gateway' NOT NULL,\n\t`trial_days` integer DEFAULT 0 NOT NULL,\n\t`limits` text,\n\t`features` text,\n\t`public_visible` integer DEFAULT true NOT NULL,\n\t`highlighted` integer DEFAULT false NOT NULL,\n\t`active` integer DEFAULT true NOT NULL,\n\t`sort_order` integer DEFAULT 0 NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL\n);",
      "CREATE UNIQUE INDEX `plans_slug_unique` ON `plans` (`slug`);",
      "CREATE INDEX `plans_active_idx` ON `plans` (`active`,`sort_order`);",
      "CREATE TABLE `platform_settings` (\n\t`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,\n\t`fine_percent` integer DEFAULT 2 NOT NULL,\n\t`interest_percent` integer DEFAULT 1 NOT NULL,\n\t`default_trial_days` integer DEFAULT 0 NOT NULL,\n\t`gateway_notifications` integer DEFAULT true NOT NULL,\n\t`default_grace_days` integer DEFAULT 5 NOT NULL,\n\t`updated_at` integer NOT NULL\n);",
      "CREATE TABLE `subscriptions` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`plan_id` text,\n\t`status` text DEFAULT 'manual' NOT NULL,\n\t`billing_type` text DEFAULT 'UNDEFINED' NOT NULL,\n\t`gateway_customer_id` text,\n\t`gateway_subscription_id` text,\n\t`price_cents` integer DEFAULT 0 NOT NULL,\n\t`coupon_code` text,\n\t`discount_cents` integer DEFAULT 0 NOT NULL,\n\t`trial_ends_at` integer,\n\t`current_period_end` integer,\n\t`canceled_at` integer,\n\t`last_event_type` text,\n\t`last_event_at` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE set null\n);",
      "CREATE UNIQUE INDEX `subscriptions_tenant_unique` ON `subscriptions` (`tenant_id`);",
      "CREATE INDEX `subscriptions_gateway_idx` ON `subscriptions` (`gateway_subscription_id`);",
      "CREATE INDEX `subscriptions_customer_idx` ON `subscriptions` (`gateway_customer_id`);",
      "CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);",
      "CREATE TABLE `webhook_events` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`provider` text DEFAULT 'asaas' NOT NULL,\n\t`event_type` text NOT NULL,\n\t`tenant_id` text,\n\t`payload` text,\n\t`processed_at` integer,\n\t`error` text,\n\t`created_at` integer NOT NULL\n);",
      "CREATE INDEX `webhook_events_received_idx` ON `webhook_events` (`created_at`);",
      "CREATE INDEX `webhook_events_tenant_idx` ON `webhook_events` (`tenant_id`,`created_at`);",
      "ALTER TABLE `tenants` ADD `plan_id` text;"
    ]
  },
  {
    "tag": "0004_provisional_drafts",
    "statements": [
      "ALTER TABLE `vehicles` ADD `draft_expires_at` integer;",
      "CREATE INDEX `vehicles_draft_expiry_idx` ON `vehicles` (`draft_expires_at`);"
    ]
  },
  {
    "tag": "0005_crm_stores_and_api",
    "statements": [
      "CREATE TABLE `stores` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`name` text NOT NULL,\n\t`slug` text NOT NULL,\n\t`whatsapp` text,\n\t`phone` text,\n\t`email` text,\n\t`address_zip` text,\n\t`address_street` text,\n\t`address_number` text,\n\t`address_complement` text,\n\t`address_district` text,\n\t`address_city` text,\n\t`address_state` text,\n\t`is_default` integer DEFAULT false NOT NULL,\n\t`active` integer DEFAULT true NOT NULL,\n\t`sort_order` integer DEFAULT 0 NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE UNIQUE INDEX `stores_tenant_slug_unique` ON `stores` (`tenant_id`,`slug`);",
      "CREATE INDEX `stores_tenant_active_idx` ON `stores` (`tenant_id`,`active`,`sort_order`);",
      "CREATE TABLE `pipeline_stages` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`name` text NOT NULL,\n\t`kind` text DEFAULT 'open' NOT NULL,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`active` integer DEFAULT true NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE INDEX `pipeline_stages_tenant_idx` ON `pipeline_stages` (`tenant_id`,`position`);",
      "CREATE TABLE `lead_events` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`lead_id` text NOT NULL,\n\t`type` text DEFAULT 'note' NOT NULL,\n\t`body` text,\n\t`user_id` text,\n\t`user_name` text,\n\t`metadata` text,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null\n);",
      "CREATE INDEX `lead_events_lead_idx` ON `lead_events` (`lead_id`,`created_at`);",
      "CREATE TABLE `lead_routing` (\n\t`tenant_id` text PRIMARY KEY NOT NULL,\n\t`mode` text DEFAULT 'off' NOT NULL,\n\t`last_assigned_user_id` text,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`last_assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null\n);",
      "CREATE TABLE `financings` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`lead_id` text,\n\t`vehicle_id` text,\n\t`vehicle_label` text,\n\t`customer_name` text NOT NULL,\n\t`customer_document` text,\n\t`customer_phone` text,\n\t`bank` text,\n\t`vehicle_price_cents` integer DEFAULT 0 NOT NULL,\n\t`down_payment_cents` integer DEFAULT 0 NOT NULL,\n\t`financed_cents` integer DEFAULT 0 NOT NULL,\n\t`installments` integer DEFAULT 0 NOT NULL,\n\t`installment_cents` integer DEFAULT 0 NOT NULL,\n\t`status` text DEFAULT 'rascunho' NOT NULL,\n\t`notes` text,\n\t`store_id` text,\n\t`created_by_user_id` text,\n\t`decided_at` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null,\n\tFOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null\n);",
      "CREATE INDEX `financings_tenant_status_idx` ON `financings` (`tenant_id`,`status`,`created_at`);",
      "CREATE INDEX `financings_lead_idx` ON `financings` (`lead_id`);",
      "CREATE TABLE `api_keys` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`name` text NOT NULL,\n\t`prefix` text NOT NULL,\n\t`key_hash` text NOT NULL,\n\t`created_by_user_id` text,\n\t`last_used_at` integer,\n\t`revoked_at` integer,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null\n);",
      "CREATE UNIQUE INDEX `api_keys_hash_unique` ON `api_keys` (`key_hash`);",
      "CREATE INDEX `api_keys_tenant_idx` ON `api_keys` (`tenant_id`,`revoked_at`);",
      "CREATE TABLE `tenant_webhooks` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`tenant_id` text NOT NULL,\n\t`url` text NOT NULL,\n\t`secret` text NOT NULL,\n\t`events` text,\n\t`active` integer DEFAULT true NOT NULL,\n\t`last_status` integer,\n\t`last_error` text,\n\t`last_attempt_at` integer,\n\t`failure_count` integer DEFAULT 0 NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade\n);",
      "CREATE INDEX `tenant_webhooks_tenant_idx` ON `tenant_webhooks` (`tenant_id`,`active`);",
      "ALTER TABLE `vehicles` ADD `store_id` text;",
      "ALTER TABLE `leads` ADD `stage_id` text;",
      "ALTER TABLE `leads` ADD `store_id` text;",
      "ALTER TABLE `users` ADD `store_id` text;",
      "ALTER TABLE `users` ADD `receives_leads` integer DEFAULT true NOT NULL;",
      "ALTER TABLE `users` ADD `permission_overrides` text;",
      "CREATE INDEX `vehicles_store_idx` ON `vehicles` (`tenant_id`,`store_id`);",
      "CREATE INDEX `leads_stage_idx` ON `leads` (`tenant_id`,`stage_id`);"
    ]
  }
];
