package com.app.entity;

import com.app.entity.enums.SenderType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Message extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id", nullable = false)
    private User senderUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false)
    private SenderType senderType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;
}
