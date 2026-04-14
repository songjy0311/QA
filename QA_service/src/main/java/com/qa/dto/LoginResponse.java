package com.qa.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private Long userId;
    private String username;
    private String nickname;
    private String role;
    private String token;

    public LoginResponse(Long userId, String username, String nickname, String role, String token) {
        this.userId = userId;
        this.username = username;
        this.nickname = nickname;
        this.role = role;
        this.token = token;
    }
}