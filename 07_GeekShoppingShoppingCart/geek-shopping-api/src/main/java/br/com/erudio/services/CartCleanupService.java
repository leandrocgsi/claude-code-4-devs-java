package br.com.erudio.services;

import java.time.Duration;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.erudio.model.CartStatus;
import br.com.erudio.repositories.CartRepository;

@Service
public class CartCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(CartCleanupService.class);

    @Autowired
    private CartRepository repository;

    @Value("${cart.cleanup.inactivity:1d}")
    private Duration inactivity;

    @Scheduled(cron = "${cart.cleanup.cron:0 0 * * * *}")
    @Transactional
    public int removeAbandoned() {
        var limit = LocalDateTime.now().minus(inactivity);
        var removed = repository.deleteAbandoned(CartStatus.OPEN, limit);
        logger.info("Removed {} abandoned carts inactive since {}", removed, limit);
        return removed;
    }
}
