package com.app.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Active le client S3 R2 uniquement lorsque les quatre propriétés nécessaires
 * sont renseignées (évite de construire un client cassé sur une config partielle).
 */
public class R2EnabledCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        return StringUtils.hasText(context.getEnvironment().getProperty("cloudflare.r2.access-key-id"))
                && StringUtils.hasText(context.getEnvironment().getProperty("cloudflare.r2.secret-access-key"))
                && StringUtils.hasText(context.getEnvironment().getProperty("cloudflare.r2.endpoint"))
                && StringUtils.hasText(context.getEnvironment().getProperty("cloudflare.r2.bucket"));
    }
}
