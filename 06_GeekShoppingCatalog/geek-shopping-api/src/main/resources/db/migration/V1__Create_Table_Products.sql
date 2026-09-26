CREATE TABLE IF NOT EXISTS `products` (
  `id`          bigint(20)    NOT NULL AUTO_INCREMENT,
  `name`        varchar(150)  NOT NULL,
  `description` varchar(255)  NOT NULL,
  `price`       decimal(65,2) NOT NULL,
  `category`    varchar(100)  NOT NULL,
  `image_url`   varchar(255)  NOT NULL,
  `quantity`    int(11)       NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
