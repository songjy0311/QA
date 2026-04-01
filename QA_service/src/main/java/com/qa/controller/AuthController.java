package com.qa.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.qa.common.JwtUtil;
import com.qa.common.Result;
import com.qa.dto.LoginRequest;
import com.qa.dto.LoginResponse;
import com.qa.entity.User;
import com.qa.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody LoginRequest request) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", request.getUsername());
        User user = userMapper.selectOne(wrapper);

        if (user == null) {
            return Result.error("用户不存在");
        }

        if (user.getStatus() == 0) {
            return Result.error("用户已被禁用");
        }

        // 明文密码验证
        if (!request.getPassword().equals(user.getPassword())) {
            return Result.error("密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        LoginResponse response = new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getRole(),
                token
        );

        return Result.success(response);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        // JWT is stateless, just return success
        return Result.success();
    }

    @GetMapping("/current")
    public Result<Map<String, Object>> getCurrentUser(@RequestAttribute("authentication") User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("nickname", user.getNickname());
        data.put("role", user.getRole());
        return Result.success(data);
    }
}