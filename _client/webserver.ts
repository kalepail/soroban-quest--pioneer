import { serve } from "https://deno.land/std@0.161.0/http/server.ts";

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

  else if (url.toString().includes('env')) {
    const env = await getEnv()

    return new Response(JSON.stringify({
      CLAIM_TOKEN: env.CLAIM_TOKEN,
      ENV: env.ENV,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
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
  const gpEnvString = new TextDecoder().decode(await run1.output()).trim()

  const run2 = Deno.run({
    cmd: ['env'],
    stdout: 'piped'
  })
  const bashEnvString = new TextDecoder().decode(await run2.output()).trim()

  const env: any = {}

  gpEnvString
    .split('\n')
    .map((env) => env.split('='))
    .forEach(([key, value]) => env[key] = value)

  bashEnvString
    .split('\n')
    .map((env) => env.split('='))
    .forEach(([key, value]) => {
      if (['ENV'].includes(key)) // Only pick those VARS we actually want
        env[key] = value
    })

  return env
}

await serve(handler, { port });