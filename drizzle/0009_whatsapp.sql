CREATE TABLE `whatsapp_connections` (
	`tenant_id` text PRIMARY KEY NOT NULL,
	`phone_number_id` text NOT NULL,
	`waba_id` text,
	`display_phone` text,
	`credentials` text NOT NULL,
	`status` text DEFAULT 'conectado' NOT NULL,
	`last_error` text,
	`last_inbound_at` integer,
	`connected_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connected_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_phone_number_unique` ON `whatsapp_connections` (`phone_number_id`);--> statement-breakpoint
ALTER TABLE `lead_events` ADD `direction` text;--> statement-breakpoint
ALTER TABLE `lead_events` ADD `external_id` text;--> statement-breakpoint
CREATE INDEX `lead_events_direction_idx` ON `lead_events` (`lead_id`,`direction`,`created_at`);
