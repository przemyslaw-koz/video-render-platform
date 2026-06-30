FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libgbm-dev \
  libasound2 \
  libxrandr2 \
  libxkbcommon-dev \
  libxfixes3 \
  libxcomposite1 \
  libxdamage1 \
  libatk-bridge2.0-0 \
  libpango-1.0-0 \
  libcairo2 \
  libcups2 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json remotion.config.ts tsconfig.json render.mjs ./
COPY src ./src
COPY public ./public

RUN npm ci

RUN npx remotion browser ensure

CMD ["node", "render.mjs"]
