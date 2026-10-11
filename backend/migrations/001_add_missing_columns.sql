-- ============================================================================
-- Migration 001: Add missing columns to relief_requests and volunteers
-- Target Database: MySQL 8.0 (Aiven Cloud / Universal MySQL)
-- Safety: Non-destructive, inspects schema first, does NOT use IF NOT EXISTS.
-- Preserves all existing tables, foreign keys, and rows.
-- ============================================================================

-- ============================================================================
-- Step 1: Pre-Migration Schema Inspection Query
-- Run this first to verify which columns currently exist in your database.
-- ============================================================================
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('relief_requests', 'volunteers')
ORDER BY TABLE_NAME, ORDINAL_POSITION;


-- ============================================================================
-- Step 2: Idempotent Migration Procedure (Safe for any MySQL 8.0 instance)
-- Checks INFORMATION_SCHEMA before adding each column to prevent duplicate errors.
-- ============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS SafeAddColumn $$
CREATE PROCEDURE SafeAddColumn(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DELIMITER ;

-- Execute Safe Additions (Non-destructive: only adds if missing)
CALL SafeAddColumn('relief_requests', 'latitude', 'FLOAT NULL');
CALL SafeAddColumn('relief_requests', 'longitude', 'FLOAT NULL');
CALL SafeAddColumn('relief_requests', 'phone', 'VARCHAR(15) NULL');
CALL SafeAddColumn('relief_requests', 'request_source', 'VARCHAR(30) NOT NULL DEFAULT "victim"');
CALL SafeAddColumn('volunteers', 'latitude', 'FLOAT NULL');
CALL SafeAddColumn('volunteers', 'longitude', 'FLOAT NULL');

-- Clean up temporary helper procedure
DROP PROCEDURE IF EXISTS SafeAddColumn;

-- Ensure disaster_id can be NULL so emergency requests are not blocked when no disaster is active
DELIMITER $$
DROP PROCEDURE IF EXISTS SafeMakeDisasterIdNullable $$
CREATE PROCEDURE SafeMakeDisasterIdNullable()
BEGIN
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'relief_requests'
          AND COLUMN_NAME = 'disaster_id'
          AND IS_NULLABLE = 'NO'
    ) THEN
        ALTER TABLE relief_requests MODIFY COLUMN disaster_id INT NULL;
    END IF;
END $$
DELIMITER ;
CALL SafeMakeDisasterIdNullable();
DROP PROCEDURE IF EXISTS SafeMakeDisasterIdNullable;


-- ============================================================================
-- Step 3: Direct DDL Statements (Alternative for clean execution)
-- If applying directly where columns are confirmed absent:
-- ============================================================================
-- ALTER TABLE relief_requests
--     ADD COLUMN latitude FLOAT NULL,
--     ADD COLUMN longitude FLOAT NULL,
--     ADD COLUMN phone VARCHAR(15) NULL,
--     ADD COLUMN request_source VARCHAR(30) NOT NULL DEFAULT 'victim';
--
-- ALTER TABLE volunteers
--     ADD COLUMN latitude FLOAT NULL,
--     ADD COLUMN longitude FLOAT NULL;


-- ============================================================================
-- Step 4: Verification Query
-- Confirms all columns exist with expected data types and defaults.
-- ============================================================================
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('relief_requests', 'volunteers')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
