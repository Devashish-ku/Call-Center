CREATE TABLE `download_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`download_type` text NOT NULL,
	`resource_id` integer,
	`resource_name` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`downloaded_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`uploaded_by` integer NOT NULL,
	`file_path` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
