# 1단계: Node 환경에서 Vue 빌드
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2단계: Nginx로 정적 파일 서비스
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx_default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
