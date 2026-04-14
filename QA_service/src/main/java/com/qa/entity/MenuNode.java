package com.qa.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("menu_node")
public class MenuNode {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long parentId;
    private String name;
    private String nodeType;
    private Integer sortOrder;
    private Integer levelDepth;
    private Integer visible;
    private Integer guestVisible;
    private String url;
    private Long originalParentId;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}