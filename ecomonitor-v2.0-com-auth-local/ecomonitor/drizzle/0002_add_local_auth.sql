-- Migration: Add local authentication support
-- Date: 2025-02-01

-- Modificar a tabela users para suportar autenticação local
ALTER TABLE `users` 
  MODIFY `openId` VARCHAR(64) UNIQUE NULL,
  ADD COLUMN `passwordHash` VARCHAR(255) NULL AFTER `openId`,
  ADD INDEX `email_idx` (`email`);

-- Comentários sobre as mudanças:
-- 1. openId agora é NULL - permite usuários com autenticação local
-- 2. passwordHash armazena bcrypt hash da senha (para autenticação local)
-- 3. email_idx - índice para busca rápida por email
