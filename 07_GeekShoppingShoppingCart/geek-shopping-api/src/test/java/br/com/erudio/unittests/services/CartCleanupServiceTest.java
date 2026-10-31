package br.com.erudio.unittests.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import br.com.erudio.model.CartStatus;
import br.com.erudio.repositories.CartRepository;
import br.com.erudio.services.CartCleanupService;

@ExtendWith(MockitoExtension.class)
class CartCleanupServiceTest {

    @InjectMocks
    private CartCleanupService service;

    @Mock
    private CartRepository repository;

    private LocalDateTime capturedLimit() {
        var captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(repository, times(1)).deleteAbandoned(eq(CartStatus.OPEN), captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("RN-10 removes the open carts inactive for longer than the configured period")
    void removesCartsOlderThanTheInactivityPeriod() {
        ReflectionTestUtils.setField(service, "inactivity", Duration.ofDays(1));
        when(repository.deleteAbandoned(eq(CartStatus.OPEN), any(LocalDateTime.class))).thenReturn(3);
        var before = LocalDateTime.now().minusDays(1);

        var removed = service.removeAbandoned();

        var after = LocalDateTime.now().minusDays(1);
        var limit = capturedLimit();
        assertEquals(3, removed);
        assertFalse(limit.isBefore(before));
        assertFalse(limit.isAfter(after));
    }

    @Test
    @DisplayName("RN-10 the period comes from the configuration")
    void usesTheConfiguredPeriod() {
        ReflectionTestUtils.setField(service, "inactivity", Duration.ofHours(2));
        when(repository.deleteAbandoned(eq(CartStatus.OPEN), any(LocalDateTime.class))).thenReturn(0);
        var before = LocalDateTime.now().minusHours(2);

        service.removeAbandoned();

        var after = LocalDateTime.now().minusHours(2);
        var limit = capturedLimit();
        assertFalse(limit.isBefore(before));
        assertFalse(limit.isAfter(after));
        assertTrue(limit.isAfter(LocalDateTime.now().minusDays(1)));
    }

    @Test
    @DisplayName("RN-10 only open carts are candidates, converted carts are never removed")
    void onlyOpenCartsAreRemoved() {
        ReflectionTestUtils.setField(service, "inactivity", Duration.ofDays(1));
        when(repository.deleteAbandoned(eq(CartStatus.OPEN), any(LocalDateTime.class))).thenReturn(0);

        var removed = service.removeAbandoned();

        assertEquals(0, removed);
        verify(repository, times(1)).deleteAbandoned(eq(CartStatus.OPEN), any(LocalDateTime.class));
    }
}
