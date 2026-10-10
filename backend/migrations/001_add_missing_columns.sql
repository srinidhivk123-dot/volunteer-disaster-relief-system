-- Migration 001: Add missing columns to relief_requests and volunteers
-- Target Database: MySQL (Aiven Cloud / Local MySQL)
-- Safety: Non-destructive, idempotent, preserves all existing tables and rows.

-- ============================================================================
-- Option A: MySQL 8.0.29+ (Native IF NOT EXISTS support)
-- ============================================================================
ALTER TABLE relief_requests 
    ADD COLUMN IF NOT EXISTS latitude FLOAT NULL,
    ADD COLUMN IF NOT EXISTS longitude FLOAT NULL,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(15) NULL,
    ADD COLUMN IF NOT EXISTS request_source VARCHAR(30) NOT NULL DEFAULT 'victim';

ALTER TABLE volunteers 
    ADD COLUMN IF NOT EXISTS latitude FLOAT NULL,
    ADD COLUMN IF NOT EXISTS longitude FLOAT NULL;


-- ============================================================================
-- Option B: Universal Idempotent Script (Compatible with all MySQL versions)
-- Uses dynamic SQL to check INFORMATION_SCHEMA before adding each column.
-- ============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS SafeAddColumn $$
CREATE PROCEDURE SafeAddColumn(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_def VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DELIMITER ;

CALL SafeAddColumn('relief_requests', 'latitude', 'FLOAT NULL');
CALL SafeAddColumn('relief_requests', 'longitude', 'FLOAT NULL');
CALL SafeAddColumn('relief_requests', 'phone', 'VARCHAR(15) NULL');
CALL SafeAddColumn('relief_requests', 'request_source', 'VARCHAR(30) NOT NULL DEFAULT "victim"');
CALL SafeAddColumn('volunteers', 'latitude', 'FLOAT NULL');
CALL SafeAddColumn('volunteers', 'longitude', 'FLOAT NULL');

DROP PROCEDURE IF EXISTS SafeAddColumn;

-- ============================================================================
-- Verification Query: Confirm column existence and data types
-- ============================================================================
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('relief_requests', 'volunteers') 
ORDER BY TABLE_NAME, ORDINAL_POSITION;
