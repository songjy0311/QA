package com.qa.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.qa.common.Result;
import com.qa.entity.MenuNode;
import com.qa.entity.QaContent;
import com.qa.entity.ManualContent;
import com.qa.mapper.MenuNodeMapper;
import com.qa.mapper.QaContentMapper;
import com.qa.mapper.ManualContentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuNodeMapper menuNodeMapper;
    private final QaContentMapper qaContentMapper;
    private final ManualContentMapper manualContentMapper;

    /**
     * 获取完整菜单树
     */
    @GetMapping("/tree")
    public Result<List<Map<String, Object>>> getMenuTree() {
        List<MenuNode> allNodes = menuNodeMapper.selectList(null);

        // 构建节点映射
        Map<Long, Map<String, Object>> nodeMap = new HashMap<>();
        List<Map<String, Object>> roots = new ArrayList<>();

        // 排序
        allNodes.sort(Comparator.comparing(MenuNode::getSortOrder));

        // 第一次遍历：创建节点Map
        for (MenuNode node : allNodes) {
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("id", node.getId());
            nodeData.put("name", node.getName());
            nodeData.put("nodeType", node.getNodeType());
            nodeData.put("parentId", node.getParentId());
            nodeData.put("levelDepth", node.getLevelDepth());
            nodeData.put("sortOrder", node.getSortOrder());
            nodeData.put("visible", node.getVisible());
            nodeData.put("guestVisible", node.getGuestVisible());
            nodeData.put("url", node.getUrl());
            nodeData.put("originalParentId", node.getOriginalParentId());
            nodeData.put("expanded", false);
            nodeData.put("children", new ArrayList<>());
            nodeMap.put(node.getId(), nodeData);
        }

        // 第二次遍历：构建树结构
        for (MenuNode node : allNodes) {
            Map<String, Object> nodeData = nodeMap.get(node.getId());
            if (node.getParentId() == 0) {
                roots.add(nodeData);
            } else if (nodeMap.containsKey(node.getParentId())) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) nodeMap.get(node.getParentId()).get("children");
                children.add(nodeData);
            }
        }

        // 检查是否有内容
        for (MenuNode node : allNodes) {
            Map<String, Object> nodeData = nodeMap.get(node.getId());
            boolean hasDirect = hasDirectContent(node.getId());
            boolean hasChild = hasChildContent(node.getId());
            nodeData.put("hasDirectContent", hasDirect);
            nodeData.put("hasChildContent", hasChild);
        }

        return Result.success(roots);
    }

    private boolean hasDirectContent(Long nodeId) {
        QueryWrapper<QaContent> qaWrapper = new QueryWrapper<>();
        qaWrapper.eq("node_id", nodeId);
        long qaCount = qaContentMapper.selectCount(qaWrapper);

        QueryWrapper<ManualContent> manualWrapper = new QueryWrapper<>();
        manualWrapper.eq("node_id", nodeId);
        long manualCount = manualContentMapper.selectCount(manualWrapper);

        return qaCount > 0 || manualCount > 0;
    }

    private boolean hasChildContent(Long nodeId) {
        QueryWrapper<MenuNode> wrapper = new QueryWrapper<>();
        wrapper.eq("parent_id", nodeId);
        List<MenuNode> children = menuNodeMapper.selectList(wrapper);

        for (MenuNode child : children) {
            if (hasDirectContent(child.getId()) || hasChildContent(child.getId())) {
                return true;
            }
        }
        return false;
    }

    /**
     * 新增节点
     */
    @PostMapping("/node")
    public Result<MenuNode> addNode(@RequestBody MenuNode node) {
        // 计算层级深度
        if (node.getParentId() != null && node.getParentId() != 0) {
            MenuNode parent = menuNodeMapper.selectById(node.getParentId());
            if (parent != null) {
                node.setLevelDepth(parent.getLevelDepth() + 1);
            }
        } else {
            node.setLevelDepth(0);
            node.setParentId(0L);
        }

        // 获取最大排序号
        QueryWrapper<MenuNode> wrapper = new QueryWrapper<>();
        wrapper.eq("parent_id", node.getParentId());
        wrapper.orderByDesc("sort_order").last("LIMIT 1");
        MenuNode lastNode = menuNodeMapper.selectOne(wrapper);
        node.setSortOrder(lastNode != null ? lastNode.getSortOrder() + 1 : 0);

        node.setVisible(1);
        node.setGuestVisible(0);
        menuNodeMapper.insert(node);
        return Result.success(node);
    }

    /**
     * 更新节点
     */
    @PutMapping("/node/{id}")
    public Result<Void> updateNode(@PathVariable Long id, @RequestBody MenuNode node) {
        node.setId(id);
        menuNodeMapper.updateById(node);
        return Result.success();
    }

    /**
     * 删除节点（软删除：移入失效菜单，记录原父节点）
     */
    @DeleteMapping("/node/{id}")
    public Result<Void> deleteNode(@PathVariable Long id) {
        MenuNode node = menuNodeMapper.selectById(id);
        if (node == null) return Result.error("节点不存在");
        if (node.getParentId() == 0) return Result.error("不能删除根节点");
        if (node.getOriginalParentId() != null) return Result.error("该节点已在失效菜单中");

        // 找失效菜单根节点
        QueryWrapper<MenuNode> invalidWrapper = new QueryWrapper<>();
        invalidWrapper.eq("node_type", "invalid").eq("parent_id", 0);
        MenuNode invalidRoot = menuNodeMapper.selectOne(invalidWrapper);
        if (invalidRoot == null) return Result.error("失效菜单根节点不存在");

        // 移入失效菜单，记录原父节点
        node.setOriginalParentId(node.getParentId());
        node.setParentId(invalidRoot.getId());
        node.setLevelDepth(1);
        menuNodeMapper.updateById(node);

        return Result.success();
    }

    /**
     * 恢复节点（从失效菜单移回原父节点）
     */
    @PostMapping("/node/{id}/restore")
    public Result<Void> restoreNode(@PathVariable Long id) {
        MenuNode node = menuNodeMapper.selectById(id);
        if (node == null) return Result.error("节点不存在");
        if (node.getOriginalParentId() == null) return Result.error("该节点无法恢复");

        MenuNode originalParent = menuNodeMapper.selectById(node.getOriginalParentId());
        if (originalParent == null) return Result.error("原父节点已不存在，无法恢复");

        Long originalParentId = node.getOriginalParentId();
        UpdateWrapper<MenuNode> uw = new UpdateWrapper<>();
        uw.eq("id", node.getId())
          .set("parent_id", originalParentId)
          .set("level_depth", originalParent.getLevelDepth() + 1)
          .set("original_parent_id", null);
        menuNodeMapper.update(null, uw);

        return Result.success();
    }

    private void deleteNodeRecursive(Long nodeId) {
        // 删除子节点
        QueryWrapper<MenuNode> wrapper = new QueryWrapper<>();
        wrapper.eq("parent_id", nodeId);
        List<MenuNode> children = menuNodeMapper.selectList(wrapper);
        for (MenuNode child : children) {
            deleteNodeRecursive(child.getId());
        }

        // 删除内容
        QueryWrapper<QaContent> qaWrapper = new QueryWrapper<>();
        qaWrapper.eq("node_id", nodeId);
        qaContentMapper.delete(qaWrapper);

        QueryWrapper<ManualContent> manualWrapper = new QueryWrapper<>();
        manualWrapper.eq("node_id", nodeId);
        manualContentMapper.delete(manualWrapper);

        // 删除节点
        menuNodeMapper.deleteById(nodeId);
    }

    /**
     * 拖拽排序
     */
    @PutMapping("/node/{id}/sort")
    public Result<Void> updateSort(
            @PathVariable Long id,
            @RequestParam String action,
            @RequestParam Long targetId) {

        MenuNode movedNode = menuNodeMapper.selectById(id);
        MenuNode targetNode = menuNodeMapper.selectById(targetId);

        if (movedNode == null || targetNode == null) {
            return Result.error("节点不存在");
        }

        // 功能菜单节点只能同父节点内排序
        if ("func".equals(movedNode.getNodeType()) && !movedNode.getParentId().equals(targetNode.getParentId())) {
            return Result.error("功能菜单根目录节点只能同父节点内排序");
        }

        // 层级限制
        if ("child".equals(action)) {
            MenuNode parent = menuNodeMapper.selectById(targetId);
            if (parent.getLevelDepth() >= 3) {
                return Result.error("已达最大层级限制");
            }
        }

        if ("before".equals(action) || "after".equals(action)) {
            // 兄弟节点内排序
            List<MenuNode> siblings = getSiblings(movedNode.getParentId());
            int fromIndex = -1, toIndex = -1;

            for (int i = 0; i < siblings.size(); i++) {
                if (siblings.get(i).getId().equals(id)) fromIndex = i;
                if (siblings.get(i).getId().equals(targetId)) toIndex = i;
            }

            if (fromIndex != -1 && toIndex != -1) {
                siblings.remove(fromIndex);
                if ("after".equals(action)) {
                    toIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
                }
                siblings.add(toIndex, movedNode);

                // 更新排序
                for (int i = 0; i < siblings.size(); i++) {
                    MenuNode n = siblings.get(i);
                    n.setSortOrder(i);
                    menuNodeMapper.updateById(n);
                }
            }
        } else if ("child".equals(action)) {
            // 成为子节点
            List<MenuNode> oldSiblings = getSiblings(movedNode.getParentId());
            oldSiblings.remove(movedNode);
            for (int i = 0; i < oldSiblings.size(); i++) {
                oldSiblings.get(i).setSortOrder(i);
                menuNodeMapper.updateById(oldSiblings.get(i));
            }

            movedNode.setParentId(targetId);
            movedNode.setLevelDepth(targetNode.getLevelDepth() + 1);

            List<MenuNode> newSiblings = getSiblings(targetId);
            movedNode.setSortOrder(newSiblings.size());
            menuNodeMapper.updateById(movedNode);
        }

        return Result.success();
    }

    private List<MenuNode> getSiblings(Long parentId) {
        QueryWrapper<MenuNode> wrapper = new QueryWrapper<>();
        wrapper.eq("parent_id", parentId);
        wrapper.orderByAsc("sort_order");
        return menuNodeMapper.selectList(wrapper);
    }

    /**
     * 上传菜单文件
     */
    @PostMapping("/upload")
    public Result<Map<String, Object>> uploadMenuFile(@RequestParam("file") MultipartFile file) {
        try {
            String content = new String(file.getBytes(), "UTF-8");
            String[] lines = content.trim().split("\n");

            List<Map<String, String>> menuData = new ArrayList<>();
            for (int i = 2; i < lines.length; i++) {
                String line = lines[i].trim();
                if (!line.isEmpty()) {
                    String[] parts = line.split("\\|");
                    if (parts.length >= 4) {
                        Map<String, String> item = new HashMap<>();
                        item.put("id", parts[0].trim());
                        item.put("name", parts[1].trim());
                        item.put("parentId", parts[2].trim());
                        item.put("level", parts[3].trim());
                        menuData.add(item);
                    }
                }
            }

            // 获取功能菜单根节点
            QueryWrapper<MenuNode> funcRootWrapper = new QueryWrapper<>();
            funcRootWrapper.eq("node_type", "func");
            MenuNode funcRoot = menuNodeMapper.selectOne(funcRootWrapper);

            // 获取失效菜单根节点
            QueryWrapper<MenuNode> invalidRootWrapper = new QueryWrapper<>();
            invalidRootWrapper.eq("node_type", "invalid");
            MenuNode invalidRoot = menuNodeMapper.selectOne(invalidRootWrapper);

            // 获取现有功能菜单节点
            QueryWrapper<MenuNode> funcWrapper = new QueryWrapper<>();
            funcWrapper.eq("parent_id", funcRoot.getId());
            List<MenuNode> existingFuncNodes = menuNodeMapper.selectList(funcWrapper);
            Set<String> existingIds = new HashSet<>();
            for (MenuNode n : existingFuncNodes) {
                existingIds.add(n.getId().toString());
            }

            // 新节点ID集合
            Set<String> newIds = new HashSet<>();
            for (Map<String, String> item : menuData) {
                newIds.add(item.get("id"));
            }

            // 找出需要失效的节点
            for (MenuNode existing : existingFuncNodes) {
                if (!newIds.contains(existing.getId().toString())) {
                    // 迁移到失效目录
                    migrateToInvalid(existing, invalidRoot);
                }
            }

            // 添加或更新节点
            for (Map<String, String> item : menuData) {
                String id = item.get("id");
                String name = item.get("name");
                String parentId = item.get("parentId");
                int level = Integer.parseInt(item.get("level"));

                if (existingIds.contains(id)) {
                    // 更新现有节点
                    QueryWrapper<MenuNode> updateWrapper = new QueryWrapper<>();
                    updateWrapper.eq("id", Long.parseLong(id));
                    MenuNode updateNode = new MenuNode();
                    updateNode.setName(name);
                    menuNodeMapper.update(updateNode, updateWrapper);
                } else {
                    // 新增节点
                    MenuNode newNode = new MenuNode();
                    newNode.setId(Long.parseLong(id));
                    newNode.setName(name);
                    newNode.setNodeType("func");
                    newNode.setParentId("0".equals(parentId) ? funcRoot.getId() : Long.parseLong(parentId));
                    newNode.setLevelDepth(level - 1);
                    newNode.setSortOrder(0);
                    newNode.setVisible(1);
                    newNode.setGuestVisible(0);
                    menuNodeMapper.insert(newNode);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("added", menuData.size() - existingIds.size());
            result.put("updated", Math.max(0, (int) existingIds.size() - (menuData.size() - (menuData.size() - existingIds.size()))));

            return Result.success(result);
        } catch (Exception e) {
            return Result.error("解析文件失败: " + e.getMessage());
        }
    }

    private void migrateToInvalid(MenuNode node, MenuNode invalidRoot) {
        // 生成新ID
        Long newId = System.currentTimeMillis() + (long) (Math.random() * 10000);

        // 更新节点
        node.setId(newId);
        node.setParentId(invalidRoot.getId());
        node.setNodeType("invalid");
        node.setLevelDepth(1);
        node.setSortOrder(0);
        menuNodeMapper.updateById(node);

        // 迁移内容
        QueryWrapper<QaContent> qaWrapper = new QueryWrapper<>();
        qaWrapper.eq("node_id", node.getId());
        List<QaContent> qaContents = qaContentMapper.selectList(qaWrapper);
        for (QaContent qa : qaContents) {
            qa.setNodeId(newId);
            qaContentMapper.updateById(qa);
        }

        QueryWrapper<ManualContent> manualWrapper = new QueryWrapper<>();
        manualWrapper.eq("node_id", node.getId());
        List<ManualContent> manualContents = manualContentMapper.selectList(manualWrapper);
        for (ManualContent manual : manualContents) {
            manual.setNodeId(newId);
            manualContentMapper.updateById(manual);
        }
    }

    /**
     * 清理三级及以下脏数据节点（levelDepth >= 2）
     */
    @DeleteMapping("/cleanup-deep")
    public Result<Map<String, Object>> cleanupDeepNodes() {
        QueryWrapper<MenuNode> wrapper = new QueryWrapper<>();
        wrapper.ge("level_depth", 2);
        wrapper.orderByDesc("level_depth"); // 从最深层开始删，避免父子依赖
        List<MenuNode> deepNodes = menuNodeMapper.selectList(wrapper);

        int deleted = 0;
        for (MenuNode node : deepNodes) {
            // 只删顶层脏节点，deleteNodeRecursive 会递归处理其子节点
            // 但因为已按深度倒序，直接逐条删即可
            deleteContentOnly(node.getId());
            menuNodeMapper.deleteById(node.getId());
            deleted++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("deleted", deleted);
        return Result.success(result);
    }

    /** 仅删除节点的内容（不递归，配合 cleanup 使用） */
    private void deleteContentOnly(Long nodeId) {
        QueryWrapper<QaContent> qaWrapper = new QueryWrapper<>();
        qaWrapper.eq("node_id", nodeId);
        qaContentMapper.delete(qaWrapper);

        QueryWrapper<ManualContent> manualWrapper = new QueryWrapper<>();
        manualWrapper.eq("node_id", nodeId);
        manualContentMapper.delete(manualWrapper);
    }

    /**
     * 更新节点配置
     */
    @PutMapping("/node/{id}/config")
    public Result<Void> updateNodeConfig(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer visible,
            @RequestParam(required = false) Integer guestVisible,
            @RequestParam(required = false) String url) {

        MenuNode node = menuNodeMapper.selectById(id);
        if (node == null) {
            return Result.error("节点不存在");
        }

        // 功能菜单根节点不可修改名称
        if (name != null && !"func".equals(node.getNodeType())) {
            node.setName(name);
        }

        if (visible != null) {
            node.setVisible(visible);
            // 级联关闭子节点
            if (visible == 0) {
                cascadeVisibility(id, 0);
            }
        }

        if (guestVisible != null) {
            node.setGuestVisible(guestVisible);
        }

        if (url != null) {
            node.setUrl(url);
        }

        menuNodeMapper.updateById(node);
        return Result.success();
    }

    private void cascadeVisibility(Long nodeId, Integer visible) {
        QueryWrapper<MenuNode> wrapper = new QueryWrapper<>();
        wrapper.eq("parent_id", nodeId);
        List<MenuNode> children = menuNodeMapper.selectList(wrapper);

        for (MenuNode child : children) {
            child.setVisible(visible);
            menuNodeMapper.updateById(child);
            cascadeVisibility(child.getId(), visible);
        }
    }
}