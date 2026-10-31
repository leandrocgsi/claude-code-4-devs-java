CREATE TABLE IF NOT EXISTS `carts` (
  `id`          bigint       NOT NULL AUTO_INCREMENT,
  `token`       varchar(36)  NOT NULL,
  `status`      varchar(20)  NOT NULL DEFAULT 'OPEN',
  `customer_id` bigint       NULL,
  `created_at`  datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`  datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_carts_token` (`token`),
  KEY `idx_carts_status_updated_at` (`status`, `updated_at`)
);
