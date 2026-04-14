-- 系统问答与操作手册管理平台 - 数据库初始化脚本
-- 执行前请确保 MySQL 服务已启动

-- 创建数据库
CREATE DATABASE IF NOT EXISTS qa_service DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qa_service;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    nickname VARCHAR(50) COMMENT '昵称',
    role VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '角色：admin-管理员 user-普通用户',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-正常 0-禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 菜单节点表
CREATE TABLE IF NOT EXISTS menu_node (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    parent_id BIGINT NOT NULL DEFAULT 0 COMMENT '父节点ID，0表示根节点',
    name VARCHAR(100) NOT NULL COMMENT '节点名称',
    node_type VARCHAR(20) NOT NULL DEFAULT 'custom' COMMENT '节点类型：custom-自定义 func-功能菜单 invalid-失效',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
    level_depth INT NOT NULL DEFAULT 0 COMMENT '层级深度',
    visible TINYINT NOT NULL DEFAULT 1 COMMENT '是否对用户可见：1-可见 0-不可见',
    guest_visible TINYINT NOT NULL DEFAULT 0 COMMENT '是否对游客可见：1-可见 0-不可见',
    url VARCHAR(500) COMMENT '关联URL，用于外部系统跳转定位',
    original_parent_id BIGINT DEFAULT NULL COMMENT '软删除前的父节点ID，非空表示已移入失效菜单',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_parent_id (parent_id),
    INDEX idx_node_type (node_type),
    INDEX idx_level_depth (level_depth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单节点表';

-- 3. 问答内容表
CREATE TABLE IF NOT EXISTS qa_content (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    node_id BIGINT NOT NULL COMMENT '所属菜单节点ID',
    title VARCHAR(100) NOT NULL COMMENT '内容标题',
    body TEXT COMMENT '富文本HTML内容',
    attachment_name VARCHAR(255) COMMENT '附件名称（演示用）',
    updater VARCHAR(50) COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
    INDEX idx_node_id (node_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问答内容表';

-- 4. 操作手册表
CREATE TABLE IF NOT EXISTS manual_content (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    node_id BIGINT NOT NULL COMMENT '所属菜单节点ID',
    title VARCHAR(100) NOT NULL COMMENT '内容标题',
    body TEXT COMMENT '富文本HTML内容',
    attachment_name VARCHAR(255) COMMENT '附件名称（演示用）',
    updater VARCHAR(50) COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
    INDEX idx_node_id (node_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作手册表';

-- 5. 投票记录表
CREATE TABLE IF NOT EXISTS content_vote (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    content_type VARCHAR(20) NOT NULL COMMENT '内容类型：qa-问答 manual-操作手册',
    content_id BIGINT NOT NULL COMMENT '内容ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    vote_type VARCHAR(20) NOT NULL COMMENT '投票类型：like-点赞 dislike-点踩',
    feedback TEXT COMMENT '点踩时的反馈意见',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '投票时间',
    UNIQUE KEY uk_user_vote (content_type, content_id, user_id),
    INDEX idx_content (content_type, content_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投票记录表';

-- 6. 操作日志表
CREATE TABLE IF NOT EXISTS op_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT COMMENT '操作用户ID',
    username VARCHAR(50) COMMENT '操作用户名',
    operation VARCHAR(100) COMMENT '操作类型',
    detail TEXT COMMENT '操作详情',
    ip VARCHAR(50) COMMENT 'IP地址',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_user_id (user_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 初始化默认用户（明文密码：admin123 / user123）
INSERT INTO sys_user (username, password, nickname, role, status) VALUES
('admin', 'admin123', '系统管理员', 'admin', 1),
('user', 'user123', '普通用户', 'user', 1);

-- 初始化默认根节点
INSERT INTO menu_node (id, parent_id, name, node_type, sort_order, level_depth, visible, guest_visible) VALUES
(1, 0, '自定义根目录', 'custom', 0, 0, 1, 0),
(2, 0, '功能菜单根目录', 'func', 1, 0, 1, 0),
(3, 0, '失效菜单根目录', 'invalid', 2, 0, 1, 0);