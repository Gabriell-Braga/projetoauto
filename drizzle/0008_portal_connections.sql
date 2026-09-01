CREATE TABLE `portal_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`portal` text NOT NULL,
	`status` text DEFAULT 'desconectado' NOT NULL,
	`credentials` text,
	`settings` text,
	`connected_by_user_id` text,
	`last_sync_at` integer,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connected_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_connections_tenant_portal_unique` ON `portal_connections` (`tenant_id`,`portal`);--> statement-breakpoint
CREATE TABLE `vehicle_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`portal` text NOT NULL,
	`external_id` text,
	`external_url` text,
	`status` text DEFAULT 'pendente' NOT NULL,
	`last_error` text,
	`synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_publications_unique` ON `vehicle_publications` (`vehicle_id`,`portal`);--> statement-breakpoint
CREATE INDEX `vehicle_publications_pending_idx` ON `vehicle_publications` (`tenant_id`,`status`);
