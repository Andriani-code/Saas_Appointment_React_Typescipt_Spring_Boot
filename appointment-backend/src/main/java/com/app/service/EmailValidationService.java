package com.app.service;

import com.app.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailValidationService {

    @Value("${abstractapi.email.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public void validateEmailExists(String email) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("AbstractAPI key not configured. Skipping real-time email validation.");
            return;
        }

        String url = String.format("https://emailvalidation.abstractapi.com/v1/?api_key=%s&email=%s", apiKey, email);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null) {
                String deliverability = (String) response.get("deliverability");
                Double qualityScore = Double.valueOf(response.get("quality_score").toString());
                Boolean isSmtpValid = (Boolean) ((Map<String, Object>) response.get("is_smtp_valid")).get("value");

                log.info("Email validation for {}: deliverability={}, qualityScore={}, isSmtpValid={}", 
                        email, deliverability, qualityScore, isSmtpValid);

                if ("UNDELIVERABLE".equalsIgnoreCase(deliverability) || !isSmtpValid || qualityScore < 0.5) {
                    throw new BadRequestException("L'e-mail n'existe pas ou n'est pas valide (vérification en temps réel)");
                }
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during email validation with AbstractAPI", e);
            // In case of API failure (rate limit, etc.), we might want to let it pass or fail.
            // Let's let it pass to avoid blocking registration if the validation service is down.
        }
    }
}
