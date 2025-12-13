# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments - API Configuration
ARG VITE_API_URL=http://14.225.253.8/api/v1
ARG VITE_API_BASE_URL=http://14.225.253.8
ARG VITE_API_TIMEOUT=30000

# Build arguments - Authentication
ARG VITE_AUTH_ACCESS_TOKEN_KEY=truckie_access_token
ARG VITE_AUTH_REFRESH_TOKEN_KEY=truckie_refresh_token

# Build arguments - Map Configuration
ARG VITE_VIET_MAPS_API_KEY=your_viet_maps_api_key
ARG VITE_OPEN_MAP_API_KEY=your_open_map_api_key
ARG VITE_OPEN_MAP_API_BASE_URL=https://mapapis.openmap.vn/v1
ARG VITE_TRACKASIA_MAP_API_KEY=your_trackasia_map_api_key
ARG VITE_TRACKASIA_MAP_API_BASE_URL=https://maps.track-asia.com

# Build arguments - App Configuration
ARG VITE_APP_NAME=Truckie
ARG VITE_APP_DESCRIPTION=Transportation Management System with Real-Time GPS Order Tracking
ARG VITE_SUPPORT_EMAIL=support@truckie.com
ARG VITE_SUPPORT_PHONE=02873005588

# Build arguments - Feature Flags
ARG VITE_FEATURE_LIVE_TRACKING=true
ARG VITE_FEATURE_NOTIFICATIONS=true
ARG VITE_FEATURE_CHAT=false

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Create .env file from build args
RUN echo "# API Configuration" > .env && \
    echo "VITE_API_URL=${VITE_API_URL}" >> .env && \
    echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" >> .env && \
    echo "VITE_API_TIMEOUT=${VITE_API_TIMEOUT}" >> .env && \
    echo "" >> .env && \
    echo "# Authentication" >> .env && \
    echo "VITE_AUTH_ACCESS_TOKEN_KEY=${VITE_AUTH_ACCESS_TOKEN_KEY}" >> .env && \
    echo "VITE_AUTH_REFRESH_TOKEN_KEY=${VITE_AUTH_REFRESH_TOKEN_KEY}" >> .env && \
    echo "" >> .env && \
    echo "# Map Configuration" >> .env && \
    echo "VITE_VIET_MAPS_API_KEY=${VITE_VIET_MAPS_API_KEY}" >> .env && \
    echo "VITE_OPEN_MAP_API_KEY=${VITE_OPEN_MAP_API_KEY}" >> .env && \
    echo "VITE_OPEN_MAP_API_BASE_URL=${VITE_OPEN_MAP_API_BASE_URL}" >> .env && \
    echo "VITE_TRACKASIA_MAP_API_KEY=${VITE_TRACKASIA_MAP_API_KEY}" >> .env && \
    echo "VITE_TRACKASIA_MAP_API_BASE_URL=${VITE_TRACKASIA_MAP_API_BASE_URL}" >> .env && \
    echo "" >> .env && \
    echo "# App Configuration" >> .env && \
    echo "VITE_APP_NAME=${VITE_APP_NAME}" >> .env && \
    echo "VITE_APP_DESCRIPTION=${VITE_APP_DESCRIPTION}" >> .env && \
    echo "VITE_SUPPORT_EMAIL=${VITE_SUPPORT_EMAIL}" >> .env && \
    echo "VITE_SUPPORT_PHONE=${VITE_SUPPORT_PHONE}" >> .env && \
    echo "" >> .env && \
    echo "# Feature Flags" >> .env && \
    echo "VITE_FEATURE_LIVE_TRACKING=${VITE_FEATURE_LIVE_TRACKING}" >> .env && \
    echo "VITE_FEATURE_NOTIFICATIONS=${VITE_FEATURE_NOTIFICATIONS}" >> .env && \
    echo "VITE_FEATURE_CHAT=${VITE_FEATURE_CHAT}" >> .env

# Build app
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]