-- Add reset token columns to users for password reset flow
ALTER TABLE `users`
  ADD COLUMN `resetToken` VARCHAR(255) NULL AFTER `password`,
  ADD COLUMN `resetTokenExpires` DATETIME NULL AFTER `resetToken`;
