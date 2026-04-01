package com.qa.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.qa.common.Result;
import com.qa.entity.MenuNode;
import com.qa.entity.QaContent;
import com.qa.entity.ManualContent;
import com.qa.entity.ContentVote;
import com.qa.mapper.MenuNodeMapper;
import com.qa.mapper.QaContentMapper;
import com.qa.mapper.ManualContentMapper;
import com.qa.mapper.ContentVoteMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final MenuNodeMapper menuNodeMapper;
    private final QaContentMapper qaContentMapper;
    private final ManualContentMapper manualContentMapper;
    private final ContentVoteMapper contentVoteMapper;

    /**
     * 获取用户可见的菜单树
     * @param isGuest 是否游客
     */
    @GetMapping("/menu/tree")
    public Result<List<Map<String, Object>>> getVisibleMenuTree(
            @RequestParam(defaultValue = "false") boolean isGuest) {
        List<MenuNode> allNodes = menuNodeMapper.selectList(null);

        // 构建节点映射
        Map<Long, Map<String, Object>> nodeMap = new HashMap<>();
        List<Map<String, Object>> roots = new ArrayList<>();

        // 第一次遍历：创建节点Map
        for (MenuNode node : allNodes) {
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("id", node.getId());
            nodeData.put("name", node.getName());
            nodeData.put("nodeType", node.getNodeType());
            nodeData.put("parentId", node.getParentId());
            nodeData.put("expanded", false);
            nodeData.put("visible", node.getVisible());
            nodeData.put("guestVisible", node.getGuestVisible());
            nodeData.put("url", node.getUrl());
            nodeData.put("children", new ArrayList<>());
            nodeMap.put(node.getId(), nodeData);
        }

        // 第二次遍历：构建树结构
        for (MenuNode node : allNodes) {
            Map<String, Object> nodeData = nodeMap.get(node.getId());

            // 根据是否游客过滤
            boolean canView = false;
            if (isGuest) {
                canView = node.getVisible() == 1 && node.getGuestVisible() == 1;
            } else {
                canView = node.getVisible() == 1;
            }
            nodeData.put("canView", canView);

            if (node.getParentId() == 0) {
                roots.add(nodeData);
            } else if (nodeMap.containsKey(node.getParentId())) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) nodeMap.get(node.getParentId()).get("children");
                children.add(nodeData);
            }
        }

        return Result.success(roots);
    }

    /**
     * 获取问答内容
     */
    @GetMapping("/content/qa/{nodeId}")
    public Result<List<Map<String, Object>>> getQaContent(@PathVariable Long nodeId) {
        QueryWrapper<QaContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", nodeId);
        wrapper.orderByAsc("sort_order");
        List<QaContent> contents = qaContentMapper.selectList(wrapper);

        List<Map<String, Object>> result = new ArrayList<>();
        for (QaContent content : contents) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", content.getId());
            data.put("title", content.getTitle());
            data.put("body", content.getBody());
            data.put("updater", content.getUpdater());
            data.put("updateTime", content.getUpdateTime());

            // 获取投票统计
            QueryWrapper<ContentVote> voteWrapper = new QueryWrapper<>();
            voteWrapper.eq("content_type", "qa");
            voteWrapper.eq("content_id", content.getId());
            List<ContentVote> votes = contentVoteMapper.selectList(voteWrapper);

            long likes = votes.stream().filter(v -> "like".equals(v.getVoteType())).count();
            long dislikes = votes.stream().filter(v -> "dislike".equals(v.getVoteType())).count();
            data.put("likes", likes);
            data.put("dislikes", dislikes);

            result.add(data);
        }
        return Result.success(result);
    }

    /**
     * 获取操作手册内容
     */
    @GetMapping("/content/manual/{nodeId}")
    public Result<List<Map<String, Object>>> getManualContent(@PathVariable Long nodeId) {
        QueryWrapper<ManualContent> wrapper = new QueryWrapper<>();
        wrapper.eq("node_id", nodeId);
        wrapper.orderByAsc("sort_order");
        List<ManualContent> contents = manualContentMapper.selectList(wrapper);

        List<Map<String, Object>> result = new ArrayList<>();
        for (ManualContent content : contents) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", content.getId());
            data.put("title", content.getTitle());
            data.put("body", content.getBody());
            data.put("updater", content.getUpdater());
            data.put("updateTime", content.getUpdateTime());

            // 获取投票统计
            QueryWrapper<ContentVote> voteWrapper = new QueryWrapper<>();
            voteWrapper.eq("content_type", "manual");
            voteWrapper.eq("content_id", content.getId());
            List<ContentVote> votes = contentVoteMapper.selectList(voteWrapper);

            long likes = votes.stream().filter(v -> "like".equals(v.getVoteType())).count();
            long dislikes = votes.stream().filter(v -> "dislike".equals(v.getVoteType())).count();
            data.put("likes", likes);
            data.put("dislikes", dislikes);

            result.add(data);
        }
        return Result.success(result);
    }

    /**
     * 投票
     */
    @PostMapping("/vote")
    public Result<Void> vote(
            @RequestParam String contentType,
            @RequestParam Long contentId,
            @RequestParam Long userId,
            @RequestParam String voteType,
            @RequestParam(required = false) String feedback) {

        // 检查是否已投票
        QueryWrapper<ContentVote> wrapper = new QueryWrapper<>();
        wrapper.eq("content_type", contentType);
        wrapper.eq("content_id", contentId);
        wrapper.eq("user_id", userId);
        ContentVote existingVote = contentVoteMapper.selectOne(wrapper);

        if (existingVote != null) {
            // 如果是相同投票，取消投票
            if (existingVote.getVoteType().equals(voteType)) {
                contentVoteMapper.deleteById(existingVote.getId());
                return Result.success();
            }
            // 不同投票类型，更新
            existingVote.setVoteType(voteType);
            existingVote.setFeedback(feedback);
            contentVoteMapper.updateById(existingVote);
        } else {
            // 新增投票
            ContentVote vote = new ContentVote();
            vote.setContentType(contentType);
            vote.setContentId(contentId);
            vote.setUserId(userId);
            vote.setVoteType(voteType);
            vote.setFeedback(feedback);
            contentVoteMapper.insert(vote);
        }

        return Result.success();
    }

    /**
     * 获取用户投票状态
     */
    @GetMapping("/vote/status")
    public Result<Map<String, Object>> getVoteStatus(
            @RequestParam String contentType,
            @RequestParam Long contentId,
            @RequestParam Long userId) {
        QueryWrapper<ContentVote> wrapper = new QueryWrapper<>();
        wrapper.eq("content_type", contentType);
        wrapper.eq("content_id", contentId);
        wrapper.eq("user_id", userId);
        ContentVote vote = contentVoteMapper.selectOne(wrapper);

        Map<String, Object> result = new HashMap<>();
        result.put("hasVoted", vote != null);
        result.put("voteType", vote != null ? vote.getVoteType() : null);
        result.put("feedback", vote != null ? vote.getFeedback() : null);

        return Result.success(result);
    }
}