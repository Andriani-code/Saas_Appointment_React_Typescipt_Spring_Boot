package com.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MessageRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 5000, message = "Message must not exceed 5000 characters")
    private String content;
}
