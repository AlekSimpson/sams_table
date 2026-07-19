FROM denoland/deno:alpine

WORKDIR /app
COPY . .
RUN deno cache main.ts

EXPOSE 8080
CMD ["run", "--allow-net", "main.ts"]
