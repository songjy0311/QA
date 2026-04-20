# 阶段1：Maven 构建
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# 先复制 pom.xml 单独下载依赖，利用 Docker 缓存层
COPY pom.xml .
RUN mvn dependency:go-offline -q
# 再复制源码并打包
COPY src ./src
RUN mvn package -DskipTests -q

# 阶段2：运行时（只包含 JRE，镜像更小）
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-jar", "app.jar"]
