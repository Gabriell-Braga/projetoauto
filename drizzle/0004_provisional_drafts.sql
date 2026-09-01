ALTER TABLE `vehicles` ADD `draft_expires_at` integer;--> statement-breakpoint
CREATE INDEX `vehicles_draft_expiry_idx` ON `vehicles` (`draft_expires_at`);
