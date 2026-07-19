import * as jose from 'jose';
import * from 'types'
import * from 'data_manager';
import * as argon2 from 'argon2';

export default class App {
    static readonly SERVER_PORT: number = 8080;

    private readonly key_pair_result = await jose.generateKeyPair('EdDSA', {
        crv: 'Ed25519',
    });

    data_manager: DataManager;

    server: HttpServer;

    route_registry = new Map<string, RouteDefinition[]>([
        [HttpMethod.GET, []],
        [HttpMethod.POST, []],
        [HttpMethod.PUT, []], 
        [HttpMethod.DELETE, []], 
    ]);

    constructor() {
        data_manager = new DataManager(SERVER_PORT);

        register_route(HttpMethod.POST, "/api/auth/register", handle_register);
        register_route(HttpMethod.POST, "/api/auth/login", handle_login);
        register_route(HttpMethod.POST, "/api/auth/refresh", handle_refresh);

        register_route(HttpMethod.GET, "/api/rules/classes", handle_get_classes);
        register_route(HttpMethod.GET, "/api/rules/races", handle_get_races);

        register_route(HttpMethod.GET, "/ws", handle_serve_websocket);

        register_protected_route(HttpMethod.GET, "/api/user/campaigns/:id/characters", handle_list_characters_by_user_campaign);
        register_protected_route(HttpMethod.GET, "/api/user/campaigns/:id", handle_get_user_campaign);
        register_protected_route(HttpMethod.PUT, "/api/user/campaigns/:id", handle_update_user_campaign);
        register_protected_route(HttpMethod.DELETE, "/api/user/campaigns/:id", handle_delete_user_campaign);
        register_protected_route(HttpMethod.GET, "/api/user/campaigns", handle_get_user_campaigns);
        register_protected_route(HttpMethod.POST, "/api/user/campaigns", handle_update_user_campaigns);

        register_protected_route(HttpMethod.POST, "/api/user/create_character", handle_create_user_character);
        register_protected_route(HttpMethod.GET, "/api/user/character/:id", handle_get_user_character);
        register_protected_route(HttpMethod.PUT, "/api/user/characters/:id", handle_update_user_character);
        register_protected_route(HttpMethod.DELETE, "/api/user/characters/:id", handle_delete_user_character);
    }

    async hash_password(password: string): Promise<string> {
        try {
            return await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 65536, // 64 MB
                timeCost: 3,       // 3 iterations
                parallelism: 4,    // 4 parallel threads
            });
        } catch (error) {
            return;
        }
    }

    async password_is_valid(password: string, hash: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, password);
        } catch (error) {
            return false;
        }
    }

    async create_session_token(): Promise<string> {
      return await new SignJWT({})
        .setProtectedHeader({ alg: "EdDSA" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(key_pair_result.private_key);
    }

    async verify_session_token(token: string): Promise<boolean> {
      try {
        await jwtVerify(token, key_pair_result.public_key);
        return true;
      } catch {
        return false;
      }
    }

    new_pattern = (path: string) => new URLPattern({ pathname: path })

    check_request_body_exists(handler: RouteHandler) : RouteHandler {
        return (request: Request) => {
            if (!request.body) {
                return json_response({ error: "Request body expected but none was found."}, 400)
            }

            return handler(request)
        }
    }

    register_route(method: HttpMethod, path: string, handler: RouteHandler) {
        const method_routes = route_registry.get(method.toUpperCase() as HttpMethod);
    
        if (!method_routes) {
            throw new Error(`HTTP method ${method} is not supported by this router.`);
        }
        
        method_routes.push({
            pattern: new_pattern(path),
            handler: check_request_body_exists(handler),
        });
    }

    authenticate(handler: RouteHandler) : RouteHandler {
        return (request: Request) => {
            // TODO: authentication code
            
            
            return handler(request);
        }
    }

    register_protected_route(method: HttpMethod, path: string, handler: RouteHandler) {
        register_route(method, path, authenticate(handler));
    }
    
    json_response(data: any, status = 200): Response {
        return new Response(JSON.stringify(data), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }

    server_handler(request: Request): Response {
        const method_routes = route_registry.get(request.method.toUpperCase() as HttpMethod);
        
        if (!method_routes) {
            return json_response(
                { error: `HTTP method ${method} is not supported by this router.` }, 404);
        }
    
        // Interate and execute match against pre-compiled URL patterns
        for (const route of method_routes) {
            const does_match = route.pattern.exec(request.url);
            if (!does_match) {
                continue
            }
    
            try {
                return route.handler(request);
    
            } catch (error) {
                return json_response({ error: `Internal Server Error: ${error}` }, 500);
            }
        }
    
        const url_path = new URL(request.url).pathname;
        return json_response({ error: `Cannot ${request.method} ${url_path}` }, 404);
    }





    // --- handlers --------------------------------
    handle_register(request: Request): Response {
        // unmarshal body into request
        const auth_request = wrap_auth_request(request);
        
        // check username and password are present nad not empty
        if (auth_request.username == "" || auth_request.password == "") {
            return json_response({ error: 'Username or password was found to be null for auth request.' }, 401);
        }
        
        // generate password hash
        const password_hash = hash_password(auth_request.password);
        if (password_hash === null || password_hash === undefined) {
            return json_response({ error: 'Server failed to hash password.' }, 500);
        }
        
        // create user in database
        const user = data_manager.create_user(auth_request.username, password_hash);
        if (user.is_empty()) {
            return json_response({ error: 'Server failed to create new user.' }, 500);
        }
        
        // sign webtoken
        const session_token = create_session_token();
        
        // return user and token in response
        return json_response({ token: session_token, user: user }, 200);
    }
    handle_login(request: Request) : Response {
        // unmarshal body into request
        const auth_request = wrap_auth_request(request);
        
        // check username and password are present and not empty
        if (auth_request.is_empty()) {
            return json_response({ error: 'Username or password was found to be null for auth request.' }, 401);
        }

        const user = data_manager.search_user(username);
        if (user.is_empty()) {
            return json_response({ error: 'User does not exist. Register first.' }, 404 );
        }
        
        // compare hash and hashed(password)
        if (!password_is_valid(auth_request.password, user.username)) {
            return json_response({ error: 'Incorrect password' }, 401);
        }
        
        // sign webtoken
        const session_token = create_session_token();
        
        // return user and token in response
        return json_response({ token: session_token, user: user }, 200);
    }
    handle_refresh(request: Request) : Response {
        // todo: 
    }

    handle_get_classes(request: Request) : Response {
        // query database for all classes
        //
        // check if classes are null then return empty list in response
        //
        // return classes in response
    }
    handle_get_races(request: Request) : Response {
        // query database for all races
        //
        // check if races are null then return empty list in repsonse
        //
        // return races in response
    }
    handle_serve_websocket(request: Request) : Response {
        // get request token 
        // check token is not missing, if so return error response
        //
        // check token is valid
        //
        // create upgrade websocket connection
        //
        // create websocket client 
        //
        // register the new client in the session
        //
        // start async client_to_hub_messenger
        // start async hub_to_client_messenger
    }

    handle_list_characters_by_user_campaign(request: Request) : Response {
        // make a database query for all characters by campaign 
        //
        // if list empty or null return empty list in response
        //
        // return characters in response
    }
    handle_get_user_campaigns(request: Request) : Response {
        // make a database query for all campaigns by user
        //
        // if list empty or null return empty list in response
        //
        // return campaigns in response
    }
    handle_update_user_campaigns(request: Request) : Response {
        // make a database query to update user campaigns with new data
        //
        // check if query successful return error response if it is not
        //
        // return new campaign list
    }
    handle_get_user_campaign(request: Request) : Response {
        // make a database query for campaign by id
        //
        // check if result is null, return error response
        //
        // return campaign in response
    }
    handle_update_user_campaign(request: Request) : Response {
        // make database query to update campaign by id
        //
        // check if not successful, return error response
        //
        // return updated campaign in response
    }
    handle_delete_user_campaign(request: Request) : Response {
        // make database query to delete campaign by id and user id
        //
        // check if not successful, return error response
        //
        // return new campaign list (without the deleted campaign) in response
    }

    handle_create_user_character(request: Request) : Response {
        // make a database query to add a new character for user
        //
        // check if query successful, return error response if it is not
        //
        // return new character in response
    }
    handle_get_user_characters(request: Request) : Response {
        // make a database query to get all characters by user
        //
        // check if list empty or null, return empty list in response
        //
        // return user characters in response
    }
    handle_get_user_character(requet: Request) : Response {
        // make a database query to get character by id and user id
        //
        // check if query was successful, if not then return error response
        //
        // return character in response
    }
    handle_update_user_character(request: Request) : Response {
        // make a database query to update character by id and user id
        //
        // check query was successful, if not then return error response
        //
        // return updated character in response
    }
    handle_delete_user_character(request: Request) : Response {
        // make a database query to delete character by id and user id
        //
        // check query was successful, if not then return error response
        //
        // return updated character in response
    }
}
