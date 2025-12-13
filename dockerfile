# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments - CHỈ NHỮNG GIÁ TRỊ QUAN TRỌNG
ARG VITE_API_URL=http://14.225.253.8/api/v1
ARG VITE_API_BASE_URL=http://14.225.253.8
ARG VITE_VIET_MAPS_API_KEY
ARG VITE_OPEN_MAP_API_KEY
ARG VITE_TRACKASIA_MAP_API_KEY

# Các giá trị cố định (không cần secret)
ENV VITE_API_TIMEOUT=30000 \
    VITE_AUTH_ACCESS_TOKEN_KEY=truckie_access_token \
    VITE_AUTH_REFRESH_TOKEN_KEY=truckie_refresh_token \
    VITE_OPEN_MAP_API_BASE_URL=https://mapapis.openmap.vn/v1 \
    VITE_TRACKASIA_MAP_API_BASE_URL=https://maps.track-asia.com \
    VITE_APP_NAME=Truckie \
    VITE_APP_DESCRIPTION="Transportation Management System with Real-Time GPS Order Tracking" \
    VITE_SUPPORT_EMAIL=support@truckie.com \
    VITE_SUPPORT_PHONE=02873005588 \
    VITE_FEATURE_LIVE_TRACKING=true \
    VITE_FEATURE_NOTIFICATIONS=true \
    VITE_FEATURE_CHAT=false

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Create .env file
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" >> .env && \
    echo "VITE_API_TIMEOUT=${VITE_API_TIMEOUT}" >> .env && \
    echo "VITE_AUTH_ACCESS_TOKEN_KEY=${VITE_AUTH_ACCESS_TOKEN_KEY}" >> .env && \
    echo "VITE_AUTH_REFRESH_TOKEN_KEY=${VITE_AUTH_REFRESH_TOKEN_KEY}" >> .env && \
    echo "VITE_VIET_MAPS_API_KEY=${VITE_VIET_MAPS_API_KEY}" >> .env && \
    echo "VITE_OPEN_MAP_API_KEY=${VITE_OPEN_MAP_API_KEY}" >> .env && \
    echo "VITE_OPEN_MAP_API_BASE_URL=${VITE_OPEN_MAP_API_BASE_URL}" >> .env && \
    echo "VITE_TRACKASIA_MAP_API_KEY=${VITE_TRACKASIA_MAP_API_KEY}" >> .env && \
    echo "VITE_TRACKASIA_MAP_API_BASE_URL=${VITE_TRACKASIA_MAP_API_BASE_URL}" >> .env && \
    echo "VITE_APP_NAME=${VITE_APP_NAME}" >> .env && \
    echo "VITE_APP_DESCRIPTION=${VITE_APP_DESCRIPTION}" >> .env && \
    echo "VITE_SUPPORT_EMAIL=${VITE_SUPPORT_EMAIL}" >> .env && \
    echo "VITE_SUPPORT_PHONE=${VITE_SUPPORT_PHONE}" >> .env && \
    echo "VITE_FEATURE_LIVE_TRACKING=${VITE_FEATURE_LIVE_TRACKING}" >> .env && \
    echo "VITE_FEATURE_NOTIFICATIONS=${VITE_FEATURE_NOTIFICATIONS}" >> .env && \
    echo "VITE_FEATURE_CHAT=${VITE_FEATURE_CHAT}" >> .env

# Build app
RUN npm run build

# Run stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx config inline
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    gzip on;' >> /etc/nginx/conf.d/default.conf && \
    echo '    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 1y;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "public, immutable";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]