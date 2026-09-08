CREATE TABLE `tenant_domains` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`domain` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`pending_records` text,
	`last_error` text,
	`last_checked_at` integer,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_domains_domain_unique` ON `tenant_domains` (`domain`);--> statement-breakpoint
CREATE INDEX `tenant_domains_tenant_idx` ON `tenant_domains` (`tenant_id`,`is_primary`);