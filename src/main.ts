import { Application, Context } from "https://deno.land/x/oak@v13.0.1/mod.ts";
import { Eta } from "https://deno.land/x/eta@v3.1.0/src/index.ts";
import { parseArgs } from "https://deno.land/std@0.207.0/cli/parse_args.ts";
import logger from "https://deno.land/x/oak_logger@1.0.0/mod.ts";
import { join } from "https://deno.land/std@0.212.0/path/join.ts";
import * as mrMime from "https://deno.land/x/mrmime@v2.0.0/mod.ts";
import { extname } from "https://deno.land/std@0.212.0/path/extname.ts";
import { Session } from "https://deno.land/x/oak_sessions/mod.ts";

const flags = parseArgs(Deno.args, {
  string: ["root", "port"],
});
const root = flags.root ?? ".";
const port = Number(flags.port ?? 80);

const app = new Application();
const eta = new Eta({ views: root });

async function handleEta(ctx: Context, pathname = ctx.request.url.pathname) {
  ctx.response.headers.append("Content-Type", "text/html");
  try {
    ctx.response.body = await eta.renderAsync(pathname, {
      ...ctx,
      Deno,
      require: (t: string) => import(t),
    });
  } catch (e) {
    console.error(e);
    ctx.response.body = e.toString();
  }
}

async function handleStatic(
  ctx: Context,
  ext: string,
  pathname = ctx.request.url.pathname,
) {
  const fptr = await Deno.open(join(root, pathname), { "read": true });
  const mime = mrMime.lookup(ext);
  if (mime != null) {
    ctx.response.headers.append("Content-Type", mime);
  }
  ctx.response.body = fptr.readable;
}

async function resolveOrStatic(ctx: Context, pathname: string) {
  const resolved = join(root, pathname);
  try {
    void await Deno.stat(resolved + ".eta");
    await handleEta(ctx, pathname + ".eta");
  } catch {
    try {
      void await Deno.stat(resolved + ".html");
      await handleStatic(ctx, ".html", pathname + ".html");
    } catch {
      await handleStatic(ctx, "");
    }
  }
}

app.use(Session.initMiddleware());
app.use(logger.logger);
app.use(async (ctx) => {
  const pathname = ctx.request.url.pathname;
  const ext = extname(ctx.request.url.pathname);
  const isIndex = ctx.request.url.pathname.endsWith("/");
  if (ext === ".eta") {
    await handleEta(ctx);
  } else if (isIndex) {
    await resolveOrStatic(ctx, pathname + "index");
  } else if (ext === "") {
    await resolveOrStatic(ctx, pathname);
  } else {
    await handleStatic(ctx, ext);
  }
});
app.use(logger.responseTime);

await app.listen({ port });
