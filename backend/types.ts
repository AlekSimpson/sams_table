
namespace AppTypes {
    export type RouteHandler = (request: Request) => Response;
    export interface RouteDefinition {
      pattern: URLPattern;
      handler: RouteHandler;
    }
    
    export enum HttpMethod {
        GET = "GET", 
        POST = "POST",
        PUT = "PUT",
        DELETE = "DELETE"
    }

    export type AuthRequest = {
        request: Request;
        username: string;
        password: string;
    }
    export wrap_auth_request(request: Request): Optional<AuthRequest> {
        const request_body = JSON.parse(request.body);
        return Optional.of({
            request: request,
            username: request_body["username"],
            password: request_body["password"]
        })
    }

    export type User = {
        username: string;
        password_hash: string;
    }

    class Optional<T> {
        private constructor(private value: T | undefined | null) {}
            
        static of<T>(value: T) { 
            return new Optional(value); 
        }
        static empty<T>() { 
            return new Optional<T>(undefined); 
        }
            
        is_empty(): boolean {
            return this.value === undefined || this.value === null;
        }
        
        get(): T {
            if (this.isEmpty()) {
                return undefined;
            }
            return this.value!;
        }
    }
}

export default AppTypes;


