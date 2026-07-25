package com.app.service;

import com.app.entity.Reservation;
import com.app.entity.enums.ReservationStatus;
import com.app.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class AppointmentReminderScheduler {

    private final ReservationRepository reservationRepository;
    private final EmailService emailService;

    // Run every hour
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendReminders() {
        log.info("Checking for appointments to send reminders (24h before)");
        
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        // Find confirmed reservations for tomorrow that haven't received a reminder yet
        // In a real app, we might check the exact time (24h +/- 1h)
        // For simplicity, we check for all confirmed reservations for the next day.
        
        // We need a custom query in repository to find these
        List<Reservation> reservations = findReservationsForReminder(tomorrow);
        
        for (Reservation reservation : reservations) {
            try {
                emailService.sendAppointmentReminder(reservation);
                reservation.setReminderSent(true);
                reservationRepository.save(reservation);
            } catch (Exception e) {
                log.error("Failed to send reminder for reservation {}", reservation.getId(), e);
            }
        }
    }

    private List<Reservation> findReservationsForReminder(LocalDate date) {
        // This is a placeholder, I'll add the real query in the repository next
        return reservationRepository.findForReminder(date, ReservationStatus.CONFIRMED);
    }
}
