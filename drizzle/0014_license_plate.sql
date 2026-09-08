ALTER TABLE `vehicles` ADD `license_plate` text;--> statement-breakpoint
ALTER TABLE `vehicle_appraisals` ADD `license_plate` text;--> statement-breakpoint
CREATE INDEX `vehicles_tenant_plate_idx` ON `vehicles` (`tenant_id`,`license_plate`);
