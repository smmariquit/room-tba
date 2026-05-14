CREATE TABLE `room_positions` (
	`room_id` integer PRIMARY KEY NOT NULL,
	`floor` integer NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
