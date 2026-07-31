package com.app.service;

import com.app.entity.Reservation;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

    public void sendBookingConfirmation(Reservation reservation) {
        String to = reservation.getClient().getUser().getEmail();
        String subject = "Confirmation de votre demande de rendez-vous";
        String content = String.format(
                "<h1>Bonjour %s,</h1>" +
                "<p>Votre demande de rendez-vous avec <strong>%s %s</strong> a été enregistrée.</p>" +
                "<p><strong>Détails :</strong></p>" +
                "<ul>" +
                "<li>Service : %s</li>" +
                "<li>Date : %s</li>" +
                "<li>Heure : %s</li>" +
                "</ul>" +
                "<p>Statut actuel : <strong>EN ATTENTE</strong>. Vous recevrez un e-mail dès que le spécialiste aura confirmé.</p>",
                reservation.getClient().getFirstName(),
                reservation.getProvider().getFirstName(), reservation.getProvider().getLastName(),
                reservation.getService().getName(),
                reservation.getSlot().getDate().format(dateFormatter),
                reservation.getSlot().getStartTime().format(timeFormatter)
        );
        sendHtmlEmail(to, subject, content);
    }

    public void sendReservationAccepted(Reservation reservation) {
        String to = reservation.getClient().getUser().getEmail();
        String subject = "Votre rendez-vous est CONFIRMÉ !";
        String content = String.format(
                "<h1>Bonne nouvelle %s !</h1>" +
                "<p>Votre rendez-vous avec <strong>%s %s</strong> a été accepté.</p>" +
                "<p><strong>Détails du rendez-vous :</strong></p>" +
                "<ul>" +
                "<li>Service : %s</li>" +
                "<li>Date : %s</li>" +
                "<li>Heure : %s</li>" +
                "</ul>" +
                "<p>Nous vous attendons avec impatience.</p>",
                reservation.getClient().getFirstName(),
                reservation.getProvider().getFirstName(), reservation.getProvider().getLastName(),
                reservation.getService().getName(),
                reservation.getSlot().getDate().format(dateFormatter),
                reservation.getSlot().getStartTime().format(timeFormatter)
        );
        sendHtmlEmail(to, subject, content);
    }

    public void sendAppointmentReminder(Reservation reservation) {
        String to = reservation.getClient().getUser().getEmail();
        String subject = "Rappel : Votre rendez-vous de demain";
        String content = String.format(
                "<h1>Bonjour %s,</h1>" +
                "<p>Ceci est un petit rappel pour votre rendez-vous de demain avec <strong>%s %s</strong>.</p>" +
                "<p><strong>Détails :</strong></p>" +
                "<ul>" +
                "<li>Service : %s</li>" +
                "<li>Heure : %s</li>" +
                "</ul>" +
                "<p>À demain !</p>",
                reservation.getClient().getFirstName(),
                reservation.getProvider().getFirstName(), reservation.getProvider().getLastName(),
                reservation.getService().getName(),
                reservation.getSlot().getStartTime().format(timeFormatter)
        );
        sendHtmlEmail(to, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
        }
    }
}
