# ===== 阶段1：构建 =====
FROM node:20-alpine AS builder

WORKDIR /app

# 使用淘宝 npm 镜像加速
RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== 阶段2：运行（nginx 静态服务）=====
FROM nginx:alpine

# 删除默认页面
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 配置：支持 SPA 路由（虽然本项目是单页，保险起见）
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    # 静态资源长缓存\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
