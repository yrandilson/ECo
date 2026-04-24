CREATE TABLE `content_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`content_type` enum('post','comment','user','image','other') NOT NULL,
	`contentId` varchar(255) NOT NULL,
	`report_type` enum('spam','harassment','false_info','inappropriate','copyright','other') NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`report_status` enum('pending','reviewing','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`severity` decimal(3,2) NOT NULL DEFAULT '0.5',
	`moderatorId` int,
	`moderatorAction` varchar(255),
	`moderatorNotes` text,
	`communityVotes` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `content_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `report_reporter_idx` ON `content_reports` (`reporterId`);--> statement-breakpoint
CREATE INDEX `report_status_idx` ON `content_reports` (`report_status`);--> statement-breakpoint
CREATE INDEX `report_content_idx` ON `content_reports` (`contentId`);--> statement-breakpoint
CREATE INDEX `report_type_idx` ON `content_reports` (`report_type`);