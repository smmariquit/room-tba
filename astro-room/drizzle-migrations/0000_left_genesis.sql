CREATE TABLE `buildings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`building_name` text NOT NULL,
	`lat` real,
	`lon` real,
	`directions` text
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text NOT NULL,
	`section` text NOT NULL,
	`type` text NOT NULL,
	`schedule` text NOT NULL,
	`room_id` integer NOT NULL,
	`course_title` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `colleges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`college_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `divisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`division_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_code` text NOT NULL,
	`directions` text,
	`building_id` integer,
	`college_id` integer,
	`division_id` integer,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`college_id`) REFERENCES `colleges`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE no action
);
