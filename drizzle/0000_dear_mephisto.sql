CREATE TABLE `call_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`call_date` text NOT NULL,
	`call_time` text NOT NULL,
	`status` text NOT NULL,
	`duration` integer,
	`customer_phone` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `data_sharing` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`shared_data_type` text NOT NULL,
	`shared_data` text,
	`message` text,
	`is_read` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);