ALTER TABLE `leads` ADD `external_id` text;--> statement-breakpoint
CREATE INDEX `leads_external_idx` ON `leads` (`tenant_id`,`external_id`);
