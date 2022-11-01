import { serve } from "https://deno.land/std@0.159.0/http/server.ts";

const port = 3000;

const handler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)

  if (request.method === 'POST') {
    const {
      access_token,
      refresh_token,
      auth_token
    } = await request.json()

    const run1 = Deno.run({
      cmd: ['gp', 'env', `ACCESS_TOKEN=${access_token}`],
      stdout: 'null'
    })

    const run2 = Deno.run({
      cmd: ['gp', 'env', `REFRESH_TOKEN=${refresh_token}`],
      stdout: 'null'
    })

    const run3 = Deno.run({
      cmd: ['gp', 'env', `AUTH_TOKEN=${auth_token}`],
      stdout: 'null'
    })

    await Promise.all([
      run1.status(),
      run2.status(),
      run3.status(),
    ])

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  else if (url.toString().includes('claim-token')) {
    const env = await getEnv()

    if (!env?.CLAIM_TOKEN) return new Response('Not Found', {
      status: 404,
    });

    else return new Response(env.CLAIM_TOKEN, {
      status: 200,
    });
  }

  else {
    let body

    try {
      body = await Deno.readTextFile(`.${url.pathname}/index.html`);
    } catch {
      body = await Deno.readTextFile('./index.html');
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
};

const getEnv = async () => {
  const run1 = Deno.run({
    cmd: ['gp', 'env'],
    stdout: 'piped'
  })
  const output = await run1.output()
  const envString = new TextDecoder().decode(output)

  const env: any = {}

  envString
    .trim()
    .split('\n')
    .map((env) => env.split('='))
    .forEach(([key, value]) => env[key] = value)

  return env
}

await serve(handler, { port });