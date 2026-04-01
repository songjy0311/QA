package com.qa.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("content_vote")
public class ContentVote {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String contentType;
    private Long contentId;
    private Long userId;
    private String voteType;
    private String feedback;
    private LocalDateTime createTime;
}