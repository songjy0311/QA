package com.qa.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.qa.common.Result;
import com.qa.entity.MenuNode;
import com.qa.entity.QaContent;
import com.qa.entity.ManualContent;
import com.qa.mapper.MenuNodeMapper;
import com.qa.mapper.QaContentMapper;
import com.qa.mapper.ManualContentMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/admin/export")
@RequiredArgsConstructor
public class ExportController {

    private final MenuNodeMapper menuNodeMapper;
    private final QaContentMapper qaContentMapper;
    private final ManualContentMapper manualContentMapper;

    /**
     * 导出问答为Excel
     */
    @GetMapping("/qa")
    public void exportQa(HttpServletResponse response) throws IOException {
        // 收集所有问答内容
        List<Map<String, Object>> allQa = new ArrayList<>();
        collectAllQa(allQa);

        if (allQa.isEmpty()) {
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":500,\"message\":\"暂无内容可导出\"}");
            return;
        }

        // 创建Excel
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Q&A");

        // 表头样式
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // 写入表头
        String[] headers = {"目录路径", "内容标题", "内容正文", "更新时间", "更新人", "点赞数", "点踩数"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // 写入数据
        int rowNum = 1;
        for (Map<String, Object> qa : allQa) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue((String) qa.get("path"));
            row.createCell(1).setCellValue((String) qa.get("title"));
            row.createCell(2).setCellValue((String) qa.get("body"));
            row.createCell(3).setCellValue((String) qa.get("updateTime"));
            row.createCell(4).setCellValue((String) qa.get("updater"));
            row.createCell(5).setCellValue(((Number) qa.get("likes")).intValue());
            row.createCell(6).setCellValue(((Number) qa.get("dislikes")).intValue());
        }

        // 自动调整列宽
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        // 下载
        String filename = "系统Q&A导出_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ".xlsx";
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=" + java.net.URLEncoder.encode(filename, "UTF-8"));

        workbook.write(response.getOutputStream());
        workbook.close();
    }

    /**
     * 导出操作手册为ZIP
     */
    @GetMapping("/manual")
    public void exportManual(HttpServletResponse response) throws IOException {
        // 收集所有操作手册
        List<Map<String, Object>> allManual = new ArrayList<>();
        collectAllManual(allManual);

        if (allManual.isEmpty()) {
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":500,\"message\":\"暂无内容可导出\"}");
            return;
        }

        // 创建ZIP
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ZipOutputStream zos = new ZipOutputStream(baos);

        // 1. 添加汇总Excel
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("操作手册汇总");

        String[] headers = {"目录路径", "内容标题", "更新时间", "更新人"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        int rowNum = 1;
        for (Map<String, Object> manual : allManual) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue((String) manual.get("path"));
            row.createCell(1).setCellValue((String) manual.get("title"));
            row.createCell(2).setCellValue((String) manual.get("updateTime"));
            row.createCell(3).setCellValue((String) manual.get("updater"));
        }

        ByteArrayOutputStream excelBaos = new ByteArrayOutputStream();
        workbook.write(excelBaos);
        zos.putNextEntry(new ZipEntry("操作手册汇总.xlsx"));
        zos.write(excelBaos.toByteArray());
        zos.closeEntry();
        workbook.close();

        // 2. 添加每个手册的Word内容（这里用HTML代替）
        for (Map<String, Object> manual : allManual) {
            String title = (String) manual.get("title");
            String path = (String) manual.get("path");
            String body = (String) manual.get("body");

            // 将HTML内容转为简单文本文件
            String entryName = path + "-" + title + ".html";
            entryName = entryName.replaceAll("[\\\\/:*?\"<>|]", "_");

            zos.putNextEntry(new ZipEntry(entryName));
            zos.write(body != null ? body.getBytes("UTF-8") : new byte[0]);
            zos.closeEntry();
        }

        zos.finish();

        // 下载
        String filename = "操作手册导出_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ".zip";
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=" + java.net.URLEncoder.encode(filename, "UTF-8"));
        response.getOutputStream().write(baos.toByteArray());
    }

    private void collectAllQa(List<Map<String, Object>> result) {
        List<MenuNode> allNodes = menuNodeMapper.selectList(null);
        Map<Long, String> pathMap = buildPathMap(allNodes);

        List<QaContent> allQa = qaContentMapper.selectList(null);
        for (QaContent qa : allQa) {
            Map<String, Object> item = new HashMap<>();
            item.put("path", pathMap.getOrDefault(qa.getNodeId(), ""));
            item.put("title", qa.getTitle());
            item.put("body", stripHtml(qa.getBody()));
            item.put("updateTime", qa.getUpdateTime() != null ? qa.getUpdateTime().toString() : "");
            item.put("updater", qa.getUpdater() != null ? qa.getUpdater() : "");
            item.put("likes", 0);
            item.put("dislikes", 0);
            result.add(item);
        }
    }

    private void collectAllManual(List<Map<String, Object>> result) {
        List<MenuNode> allNodes = menuNodeMapper.selectList(null);
        Map<Long, String> pathMap = buildPathMap(allNodes);

        List<ManualContent> allManual = manualContentMapper.selectList(null);
        for (ManualContent manual : allManual) {
            Map<String, Object> item = new HashMap<>();
            item.put("path", pathMap.getOrDefault(manual.getNodeId(), ""));
            item.put("title", manual.getTitle());
            item.put("body", manual.getBody());
            item.put("updateTime", manual.getUpdateTime() != null ? manual.getUpdateTime().toString() : "");
            item.put("updater", manual.getUpdater() != null ? manual.getUpdater() : "");
            result.add(item);
        }
    }

    private Map<Long, String> buildPathMap(List<MenuNode> nodes) {
        Map<Long, String> pathMap = new HashMap<>();
        Map<Long, MenuNode> nodeMap = new HashMap<>();

        for (MenuNode node : nodes) {
            nodeMap.put(node.getId(), node);
        }

        for (MenuNode node : nodes) {
            String path = buildPath(node, nodeMap);
            pathMap.put(node.getId(), path);
        }

        return pathMap;
    }

    private String buildPath(MenuNode node, Map<Long, MenuNode> nodeMap) {
        List<String> names = new ArrayList<>();
        MenuNode current = node;

        while (current != null && current.getParentId() != 0) {
            names.add(0, current.getName());
            current = nodeMap.get(current.getParentId());
        }

        if (current != null) {
            names.add(0, current.getName());
        }

        return String.join(" -> ", names);
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "").trim();
    }
}