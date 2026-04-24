CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`occurrenceId` int,
	`alert_type` enum('geofence','severity','validation','news') NOT NULL,
	`severity_level` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`message` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badge_type` enum('fire_watcher','water_guardian','verifier','student','star','environmental_hero') NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occurrences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`occurrence_type` enum('fire','water_pollution','air_pollution','drought','deforestation','flooding','other') NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`description` text,
	`severity_level` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('pending','validated','rejected','archived') NOT NULL DEFAULT 'pending',
	`validatedBySatellite` boolean DEFAULT false,
	`communityValidations` int DEFAULT 0,
	`communityRejections` int DEFAULT 0,
	`physicalParameters` json,
	`riskScore` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occurrences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`occurrenceId` int NOT NULL,
	`photoUrl` varchar(512) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthlyPoints` int DEFAULT 0,
	`totalPoints` int DEFAULT 0,
	`monthlyRank` int DEFAULT 0,
	`overallRank` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rankings_id` PRIMARY KEY(`id`),
	CONSTRAINT `rankings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sim_type` enum('fire','water','pollution') NOT NULL,
	`parameters` json NOT NULL,
	`results` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`occurrenceId` int NOT NULL,
	`userId` int NOT NULL,
	`isValid` boolean NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `validations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','moderator','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `points` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trustScore` decimal(3,2) DEFAULT '0.50' NOT NULL;--> statement-breakpoint
CREATE INDEX `alert_user_idx` ON `alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `badge_user_idx` ON `badges` (`userId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `occurrences` (`userId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `occurrences` (`occurrence_type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `occurrences` (`status`);--> statement-breakpoint
CREATE INDEX `geo_idx` ON `occurrences` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `sim_user_idx` ON `simulations` (`userId`);--> statement-breakpoint
CREATE INDEX `validation_occurrence_idx` ON `validations` (`occurrenceId`);--> statement-breakpoint
CREATE INDEX `validation_user_idx` ON `validations` (`userId`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);