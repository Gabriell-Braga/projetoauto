CREATE TABLE `password_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`delivered` integer DEFAULT false NOT NULL,
	`requested_ip` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_resets_token_unique` ON `password_resets` (`token_hash`);--> statement-breakpoint
CREATE INDEX `password_resets_user_idx` ON `password_resets` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `password_resets_expires_idx` ON `password_resets` (`expires_at`);--> statement-breakpoint
ALTER TABLE `billing_status` ADD `grace_days` integer DEFAULT 5 NOT NULL;