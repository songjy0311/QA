# 用户指引配置平台

系统问答与操作手册管理平台，支持管理员配置目录树、Q&A 内容和操作手册，普通用户查阅使用。

---

## 一、环境要求

只需要安装 **Docker Desktop**，无需本地安装 Java、Node.js、MySQL。

| 工具 | 版本要求 | 下载地址 |
|------|---------|---------|
| Docker Desktop | 4.x 及以上 | https://www.docker.com/products/docker-desktop |

安装完成后确保 Docker Desktop 已启动（任务栏有鲸鱼图标且状态为 Running）。

---

## 二、快速启动

### 第一步：克隆代码

```bash
git clone https://github.com/songjy0311/QA.git
cd QA
```

### 第二步：一键启动

```bash
docker compose up -d
```

首次启动会自动拉取镜像并构建，耗时约 **3~10 分钟**（取决于网络和机器性能），请耐心等待。

### 第三步：确认启动状态

```bash
docker compose ps
```

看到三个服务均为 `running` 即为成功：

```
NAME           STATUS
qa-mysql       running (healthy)
qa-backend     running
qa-frontend    running
```

> 如果 `qa-backend` 显示 `starting`，说明正在等待数据库就绪，稍等片刻即可。

---

## 三、访问地址

| 地址 | 说明 |
|------|------|
| http://localhost | 前端页面（用户端 + 管理端） |
| http://localhost:8080 | 后端 API（接口调试用） |
| localhost:3306 | MySQL 数据库（数据库工具连接用） |

---

## 四、默认账号

| 账号 | 密码 | 角色 | 用途 |
|------|------|------|------|
| admin | admin123 | 管理员 | 配置目录树、管理内容 |
| user | user123 | 普通用户 | 查阅 Q&A 和操作手册 |

**登录说明：** 登录页面需要选择角色（管理员 / 普通用户），角色必须与账号匹配，否则会提示错误。

---

## 五、功能说明

### 管理员端（admin 登录后进入）

- **目录树管理**：新增/删除二级目录节点，支持拖拽排序
- **节点配置**：配置节点的关联 URL、可见性（对用户可见 / 对游客可见）
- **内容管理**：为每个节点挂载 Q&A 问答和操作手册（富文本编辑）
- **内容移动**：多选内容批量移动到其他节点
- **批量下载**：导出全部 Q&A（Excel）或全部操作手册（ZIP）
- **失效菜单**：删除的节点会进入失效菜单，可一键恢复

### 普通用户端（user 登录后进入）

- 按目录树浏览 Q&A 和操作手册
- 内容点赞 / 点踩反馈
- 关键词搜索

---

## 六、常用管理命令

```bash
# 查看运行状态
docker compose ps

# 查看后端日志（实时）
docker compose logs -f backend

# 查看所有服务日志
docker compose logs -f

# 停止所有服务（数据保留）
docker compose stop

# 重新启动
docker compose start

# 停止并删除容器（数据仍保留在 volume 中）
docker compose down

# 彻底清除所有数据（慎用！数据库数据会丢失）
docker compose down -v
```

---

## 七、常见问题

### Q：启动后访问 http://localhost 显示空白或报错？

后端可能还未完全启动，等待 30 秒后刷新。可通过以下命令查看后端启动日志：

```bash
docker compose logs backend
```

看到 `Started QaServiceApplication` 表示启动完成。

### Q：端口冲突（80、8080、3306 被占用）？

修改 `docker-compose.yml` 中的端口映射，例如将前端改到 8088：

```yaml
frontend:
  ports:
    - "8088:80"   # 左边是本机端口，右边是容器端口
```

修改后重新执行 `docker compose up -d`。

### Q：如何连接数据库查看数据？

使用 Navicat、DBeaver 等工具连接：

| 参数 | 值 |
|------|----|
| Host | localhost |
| Port | 3306 |
| 用户名 | root |
| 密码 | bomc0705 |
| 数据库 | qa_service |

### Q：代码更新后如何重新部署？

```bash
git pull
docker compose up -d --build
```

`--build` 会重新构建镜像，确保代码变更生效。

### Q：数据库数据在哪里？

数据保存在 Docker volume `qa_mysql_data` 中，即使删除容器也不会丢失。只有执行 `docker compose down -v` 才会清除。

---

## 八、项目结构

```
QA/
├── docker-compose.yml        # 一键启动配置
├── QA_service/               # Spring Boot 后端
│   ├── Dockerfile
│   ├── init.sql              # 数据库初始化脚本（自动执行）
│   └── src/
├── front_service/            # Vue 3 前端
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
└── front/                    # 静态页面（备用）
```

---

## 九、技术栈

| 层次 | 技术 |
|------|------|
| 前端 | Vue 3 + Element Plus + Vite |
| 后端 | Spring Boot 3.2 + MyBatis-Plus + Spring Security |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose + Nginx |
