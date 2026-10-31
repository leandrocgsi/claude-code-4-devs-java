CREATE TABLE IF NOT EXISTS `cart_items` (
  `id`         bigint      NOT NULL AUTO_INCREMENT,
  `cart_id`    bigint      NOT NULL,
  `product_id` bigint      NOT NULL,
  `quantity`   int         NOT NULL,
  `color`      varchar(50) NULL,
  `size`       varchar(20) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cart_items_cart_id` (`cart_id`),
  KEY `idx_cart_items_product_id` (`product_id`),
  CONSTRAINT `fk_cart_items_cart`
    FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
);
