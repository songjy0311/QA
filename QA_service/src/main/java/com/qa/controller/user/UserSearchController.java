package com.qa.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.qa.common.Result;
import com.qa.entity.MenuNode;
import com.qa.entity.QaContent;
import com.qa.entity.ManualContent;
import com.qa.mapper.MenuNodeMapper;
import com.qa.mapper.QaContentMapper;
import com.qa.mapper.ManualContentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/user/search")
@RequiredArgsConstructor
public class UserSearchController {

    private final QaContentMapper qaContentMapper;
    private final ManualContentMapper manualContentMapper;
    private final MenuNodeMapper menuNodeMapper;

    /**
     * 用户端搜索内容（仅搜索可见节点的内容）
     * @param keyword 搜索关键词
     * @param limit 返回结果数量限制，默认20
     */
    @GetMapping
    public Result<List<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "20") Integer limit,
            @RequestParam(required = false) Integer userId) {

        if (keyword == null || keyword.trim().isEmpty()) {
            return Result.success(new ArrayList<>());
        }

        // 获取可见节点ID列表
        List<MenuNode> allNodes = menuNodeMapper.selectList(null);
        Set<Long> visibleNodeIds = new HashSet<>();

        for (MenuNode node : allNodes) {
            if (node.getVisible() == 1) {
                visibleNodeIds.add(node.getId());
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();

        // 构建路径映射
        Map<Long, String> pathMap = buildPathMap(allNodes);

        // 搜索Q&A（仅搜索可见节点）
        QueryWrapper<QaContent> qaWrapper = new QueryWrapper<>();
        qaWrapper.like("title", keyword);
        qaWrapper.orderByDesc("update_time");
        List<QaContent> qaContents = qaContentMapper.selectList(qaWrapper);

        for (QaContent content : qaContents) {
            if (visibleNodeIds.contains(content.getNodeId())) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", content.getId());
                item.put("title", content.getTitle());
                item.put("nodeId", content.getNodeId());
                item.put("path", pathMap.getOrDefault(content.getNodeId(), ""));
                item.put("type", "qa");
                item.put("updateTime", content.getUpdateTime());
                results.add(item);
            }
        }

        // 搜索操作手册（仅搜索可见节点）
        QueryWrapper<ManualContent> manualWrapper = new QueryWrapper<>();
        manualWrapper.like("title", keyword);
        manualWrapper.orderByDesc("update_time");
        List<ManualContent> manuals = manualContentMapper.selectList(manualWrapper);

        for (ManualContent content : manuals) {
            if (visibleNodeIds.contains(content.getNodeId())) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", content.getId());
                item.put("title", content.getTitle());
                item.put("nodeId", content.getNodeId());
                item.put("path", pathMap.getOrDefault(content.getNodeId(), ""));
                item.put("type", "manual");
                item.put("updateTime", content.getUpdateTime());
                results.add(item);
            }
        }

        // 排序并限制数量
        if (results.size() > limit) {
            results = results.subList(0, limit);
        }

        return Result.success(results);
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

        return String.join(" > ", names);
    }
}