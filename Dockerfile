FROM node:18-alpine
WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --production=true

COPY .env .env
COPY .next ./.next
COPY public ./public
COPY prisma ./prisma
COPY node_modules ./node_modules
COPY next.config.ts ./next.config.ts

EXPOSE 3001

CMD ["yarn", "start"]
