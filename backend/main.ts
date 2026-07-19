import * from 'app.ts'

let app = App();

const server = Deno.serve({ port: App.SERVER_PORT }, app.server_handler)
app.server = server;








