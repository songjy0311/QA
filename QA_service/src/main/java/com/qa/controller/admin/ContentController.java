package com.qa.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.qa.common.Result;
import com.qa.entity.QaContent;
import com.qa.entity.ManualContent;
import com.qa.mapper.QaContentMapper;
import com.qa.mapper.ManualContentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/content")
@RequiredArgsConstructor
public class ContentController {

    private final QaContentMapper qaContentMapper;
    private final ManualContentMapper manualContentMapper;

    // ========== Q&A 内容管理 ==========

    /**
     * 获取问答列表
     */
    @GetMapping("/qa/{nodeId}")
    public Result<List<Map<String, Object>>> getQaList(@PathVariable Long nodeId) {
        QueryWrapper<QaContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", nodeId);
        wrapper.orderByAsc("sort_order");
        List<QaContent> contents = qaContentMapper.selectList(wrapper);

        List<Map<String, Object>> result = new ArrayList<>();
        for (QaContent content : contents) {
            result.add(convertQaToMap(content));
        }
        return Result.success(result);
    }

    /**
     * 新增问答
     */
    @PostMapping("/qa")
    public Result<QaContent> addQa(@RequestBody QaContent content) {
        // 获取最大排序号
        QueryWrapper<QaContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", content.getNodeId());
        wrapper.orderByDesc("sort_order").last("LIMIT 1");
        QaContent last = qaContentMapper.selectOne(wrapper);
        content.setSortOrder(last != null ? last.getSortOrder() + 1 : 0);

        content.setId(null); // 确保自增
        qaContentMapper.insert(content);
        return Result.success(content);
    }

    /**
     * 更新问答
     */
    @PutMapping("/qa/{id}")
    public Result<Void> updateQa(@PathVariable Long id, @RequestBody QaContent content) {
        content.setId(id);
        qaContentMapper.updateById(content);
        return Result.success();
    }

    /**
     * 删除问答
     */
    @DeleteMapping("/qa/{id}")
    public Result<Void> deleteQa(@PathVariable Long id) {
        qaContentMapper.deleteById(id);
        return Result.success();
    }

    /**
     * 批量移动问答
     */
    @PostMapping("/qa/move")
    public Result<Void> moveQa(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Object> rawIds = (List<Object>) params.get("contentIds");
        Long targetNodeId = ((Number) params.get("targetNodeId")).longValue();

        for (Object raw : rawIds) {
            Long id = ((Number) raw).longValue();
            QaContent content = qaContentMapper.selectById(id);
            if (content != null) {
                content.setNodeId(targetNodeId);
                qaContentMapper.updateById(content);
            }
        }
        return Result.success();
    }

    /**
     * 问答排序
     */
    @PutMapping("/qa/{id}/sort")
    public Result<Void> sortQa(
            @PathVariable Long id,
            @RequestParam Integer newIndex) {

        QaContent content = qaContentMapper.selectById(id);
        if (content == null) {
            return Result.error("内容不存在");
        }

        QueryWrapper<QaContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", content.getNodeId());
        wrapper.orderByAsc("sort_order");
        List<QaContent> list = qaContentMapper.selectList(wrapper);

        int oldIndex = -1;
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getId().equals(id)) {
                oldIndex = i;
                break;
            }
        }

        if (oldIndex != -1 && oldIndex != newIndex) {
            list.remove(oldIndex);
            newIndex = Math.min(newIndex, list.size());
            list.add(newIndex, content);

            for (int i = 0; i < list.size(); i++) {
                list.get(i).setSortOrder(i);
                qaContentMapper.updateById(list.get(i));
            }
        }

        return Result.success();
    }

    // ========== 操作手册管理 ==========

    /**
     * 获取操作手册列表
     */
    @GetMapping("/manual/{nodeId}")
    public Result<List<Map<String, Object>>> getManualList(@PathVariable Long nodeId) {
        QueryWrapper<ManualContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", nodeId);
        wrapper.orderByAsc("sort_order");
        List<ManualContent> contents = manualContentMapper.selectList(wrapper);

        List<Map<String, Object>> result = new ArrayList<>();
        for (ManualContent content : contents) {
            result.add(convertManualToMap(content));
        }
        return Result.success(result);
    }

    /**
     * 新增操作手册
     */
    @PostMapping("/manual")
    public Result<ManualContent> addManual(@RequestBody ManualContent content) {
        QueryWrapper<ManualContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", content.getNodeId());
        wrapper.orderByDesc("sort_order").last("LIMIT 1");
        ManualContent last = manualContentMapper.selectOne(wrapper);
        content.setSortOrder(last != null ? last.getSortOrder() + 1 : 0);

        content.setId(null);
        manualContentMapper.insert(content);
        return Result.success(content);
    }

    /**
     * 更新操作手册
     */
    @PutMapping("/manual/{id}")
    public Result<Void> updateManual(@PathVariable Long id, @RequestBody ManualContent content) {
        content.setId(id);
        manualContentMapper.updateById(content);
        return Result.success();
    }

    /**
     * 删除操作手册
     */
    @DeleteMapping("/manual/{id}")
    public Result<Void> deleteManual(@PathVariable Long id) {
        manualContentMapper.deleteById(id);
        return Result.success();
    }

    /**
     * 批量移动操作手册
     */
    @PostMapping("/manual/move")
    public Result<Void> moveManual(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Object> rawIds = (List<Object>) params.get("contentIds");
        Long targetNodeId = ((Number) params.get("targetNodeId")).longValue();

        for (Object raw : rawIds) {
            Long id = ((Number) raw).longValue();
            ManualContent content = manualContentMapper.selectById(id);
            if (content != null) {
                content.setNodeId(targetNodeId);
                manualContentMapper.updateById(content);
            }
        }
        return Result.success();
    }

    /**
     * 操作手册排序
     */
    @PutMapping("/manual/{id}/sort")
    public Result<Void> sortManual(
            @PathVariable Long id,
            @RequestParam Integer newIndex) {

        ManualContent content = manualContentMapper.selectById(id);
        if (content == null) {
            return Result.error("内容不存在");
        }

        QueryWrapper<ManualContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", content.getNodeId());
        wrapper.orderByAsc("sort_order");
        List<ManualContent> list = manualContentMapper.selectList(wrapper);

        int oldIndex = -1;
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getId().equals(id)) {
                oldIndex = i;
                break;
            }
        }

        if (oldIndex != -1 && oldIndex != newIndex) {
            list.remove(oldIndex);
            newIndex = Math.min(newIndex, list.size());
            list.add(newIndex, content);

            for (int i = 0; i < list.size(); i++) {
                list.get(i).setSortOrder(i);
                manualContentMapper.updateById(list.get(i));
            }
        }

        return Result.success();
    }

    // ========== 工具方法 ==========

    private Map<String, Object> convertQaToMap(QaContent content) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", content.getId());
        map.put("nodeId", content.getNodeId());
        map.put("title", content.getTitle());
        map.put("body", content.getBody());
        map.put("attachmentName", content.getAttachmentName());
        map.put("updater", content.getUpdater());
        map.put("updateTime", content.getUpdateTime());
        map.put("sortOrder", content.getSortOrder());
        return map;
    }

    private Map<String, Object> convertManualToMap(ManualContent content) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", content.getId());
        map.put("nodeId", content.getNodeId());
        map.put("title", content.getTitle());
        map.put("body", content.getBody());
        map.put("attachmentName", content.getAttachmentName());
        map.put("updater", content.getUpdater());
        map.put("updateTime", content.getUpdateTime());
        map.put("sortOrder", content.getSortOrder());
        return map;
    }
}