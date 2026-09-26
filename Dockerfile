# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci

COPY . .

# Supabase URL and anon key are baked into the bundle at build time.
# Pass them via --build-arg when targeting an environment other than localhost.
ARG VITE_SUPABASE_URL=https://vbqwvoboyednglgctkyf.supabase.co
ARG VITE_SUPABASE_ANON_KEY=sb_publishable_01E-j7hryzrMR9MLtIpM8A_b3qOkWF7

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
