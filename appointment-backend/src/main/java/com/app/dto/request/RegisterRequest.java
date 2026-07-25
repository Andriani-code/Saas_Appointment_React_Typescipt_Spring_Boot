package com.app.dto.request;

import com.app.entity.enums.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Email requis")
    @Email(message = "Format invalide de l'email")
    private String email;

    @NotBlank(message = "Mot de passe requis")
    @Size(min = 8, message = "Mot de passe au moins 8 caractères")
    private String password;

    @NotNull(message = "Le role est requis")
    private Role role;

    @Valid
    private ClientRequest clientProfile;

    @Valid
    private SpecialistRequest specialistProfile;
}
