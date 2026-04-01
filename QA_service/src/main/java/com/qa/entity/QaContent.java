package com.qa.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("qa_content")
public class QaContent {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long nodeId;
    private String title;
    private String body;
    private String attachmentName;
    private String updater;
    private LocalDateTime updateTime;
    private Integer sortOrder;
}