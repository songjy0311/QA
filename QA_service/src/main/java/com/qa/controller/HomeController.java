package com.qa.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, Object> home() {
        Map<String, Object> result = new HashMap<>();
        result.put("message", "系统问答与操作手册管理平台 API");
        result.put("version", "1.0.0");
        result.put("status", "running");
        return result;
    }
}