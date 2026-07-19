FROM denoland/deno:alpine AS builder
WORKDIR /app
COPY package.json deno.json ./
RUN deno install
COPY . .
RUN deno task build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
