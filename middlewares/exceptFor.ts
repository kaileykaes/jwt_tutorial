import { MiddlewareHandler, MiddlewareHandlerContext } from '$fresh/server.ts';
import { KnownMethod } from '$fresh/src/server/router.ts';

type ExceptConfig = Record<string, KnownMethod[]>;

export function exceptFor<T>(
  config: ExceptConfig,
  handler: MiddlewareHandler<T>,
): MiddlewareHandler<T> {
  return (
    req: Request,
    ctx: MiddlewareHandlerContext<T>,
  ): Response | Promise<Response> => {
    const url = new URL(req.url);
    const methods = config[url.pathname];
    if (methods?.includes(req.method as KnownMethod)) {
      return ctx.next();
    }

    return handler(req, ctx);
  };
}
