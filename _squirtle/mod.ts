import yargs from 'https://deno.land/x/yargs@v17.6.0-deno/deno.ts';
import { Confirm } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

const runLogin = async () => {
  let env: any = await getEnv()
  let user

  const { AUTH_TOKEN, ENV } = env
  const isDev = ENV !== 'prod'
  const apiUrl = isDev ? 'https://api-dev.stellar.quest' : 'https://api.stellar.quest'

  console.log(AUTH_TOKEN);

  if (AUTH_TOKEN)
    user = await getUser(env)

  else {
    const authConfirmed = await Confirm.prompt('Authenticate your Gitpod account with Discord');

    if (!authConfirmed)
      return

    const run1 = Deno.run({
      cmd: ['gp', 'url', '3000'],
      stdout: 'piped'
    })
    const output = await run1.output()
    const gitpodUrl = new URL(new TextDecoder().decode(output))
    const discordUrl = new URL('https://discord.com/api/oauth2/authorize')
    discordUrl.searchParams.append('client_id', isDev ? '1024724391759724627' : '775714192161243161');
    discordUrl.searchParams.append('redirect_uri', `${apiUrl}/hooks/discord/code`);
    discordUrl.searchParams.append('response_type', 'code');
    discordUrl.searchParams.append('scope', 'identify email connections');
    discordUrl.searchParams.append('prompt', 'consent');
    discordUrl.searchParams.append('state', gitpodUrl.toString());

    const run2 = Deno.run({
      cmd: ['gp', 'preview', '--external', discordUrl.toString()]
      // cmd: ['gp', 'preview', '--external', `https://quest.stellar.org/register?gitpod_auth_url=${encodeURIComponent(discordUrl.toString())}`]
    })
    await run2.status()

    // await until gp env includes AUTH_TOKEN (or timeout after 5 minutes??)
    await new Promise((resolve) => {
      const interval = setInterval(async () => {
        env = await getEnv()

        const { AUTH_TOKEN } = env

        if (AUTH_TOKEN) {
          clearInterval(interval)
          resolve(true)
          user = await getUser(env)
        }
      }, 5000)
    })
  }

  await runUser(null, user, env)
}

const runUser = async (
  _: any, // throw away yargs
  user: any,
  env: any
) => {
  if (!env)
    env = await getEnv()

  const { AUTH_TOKEN, ENV } = env
  const isDev = ENV !== 'prod'
  const siteUrl = isDev ? 'https://quest-dev.stellar.org' : 'https://quest.stellar.org'

  if (!AUTH_TOKEN)
    return console.log(`Please run the <login> command first`);

  if (!user)
    user = await getUser(env)

  console.log(`-----------------------------`);
  console.log(`✅ Successfully authenticated`);
  console.log(`-----------------------------`);

  let missing = false

  if (user.pk)
    console.log(`   ✅ Stellar wallet is connected`);
  else {
    missing = true
    console.log(`   ❌ Please connect your Stellar wallet`);
  }

  if (user.kyc.status === 'approved')
    console.log(`   ✅ KYC flow has been completed`);
  else {
    missing = true
    console.log(`   ❌ Please complete the KYC flow`);
  }

  if (user.tax)
    console.log(`   ✅ Tax documents have been uploaded`);
  else {
    missing = true
    console.log(`   ❌ Please upload your tax documents`);
  }

  console.log(`-----------------------------`);

  if (missing) {
    const missingConfirmed = await Confirm.prompt(`Your account is not yet fully complete. 
   This could affect your ability to claim either NFT or XLM rewards.
   Would you like to complete your Stellar Quest account?`);

    if (!missingConfirmed)
      return

    const run1 = Deno.run({
      cmd: ['gp', 'preview', '--external', `${siteUrl}/settings`]
    })
    await run1.status()
  }
}

const runOpen = async () => {
  const env = await getEnv()

  const { ENV } = env
  const isDev = ENV !== 'prod'
  const siteUrl = isDev ? 'https://quest-dev.stellar.org' : 'https://quest.stellar.org'

  const run1 = Deno.run({
    cmd: ['gp', 'preview', '--external', siteUrl]
  })
  return run1.status()
}

const runLogout = () => {
  const run1 = Deno.run({
    cmd: ['gp', 'env', '-u', 'AUTH_TOKEN'],
  })
  return run1.status()
}

const runCheck = () => {
  console.log('Check command intentionally left empty for now...');
}

const runPull = async () => {
  const url = new URL(import.meta.url);
  const [root, directory, workspace] = url.pathname.split('/')
  const questDirectory = [root, directory, workspace].join('/') + '/quests/'

  const run1 = Deno.run({
    cmd: ['git', 'stash',],
  })
  await run1.status()

  const run2 = Deno.run({
    cmd: ['git', 'fetch', '--all'],
  })
  await run2.status()

  const run3 = Deno.run({
    cmd: ['git', 'checkout', 'origin/main', '--theirs', questDirectory],
  })
  await run3.status()

  const run4 = Deno.run({
    cmd: ['git', 'stash', 'pop'],
  })
  await run4.status()
}

const runPlay = () => {
  console.log('Play command intentionally left empty for now...');
}

const runSubmit = () => {
  console.log('Submit command intentionally left empty for now...');
}

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

const getUser = (env: any) => {
  const { AUTH_TOKEN, ENV } = env
  const isDev = ENV !== 'prod'
  const apiUrl = isDev ? 'https://api-dev.stellar.quest' : 'https://api.stellar.quest'

  return fetch(`${apiUrl}/user`, { 
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  })
    .then(handleResponse)
    .catch(async (err) => {
      await runLogout()
      throw err
    })
}

const handleResponse = async (response: any) => {
  const isResponseJson = response.headers.get('content-type')?.indexOf('json') > -1

  if (response.ok)
    return isResponseJson
      ? response.json()
      : response.text()

  throw isResponseJson
    ? {
      ...await response.json(),
      status: response.status
    }
    : await response.text()
}

yargs(Deno.args)
  .scriptName('sq')
  .command('login', 'Connect your Stellar Quest account to Gitpod', runLogin)
  .command('logout', 'Disconnect your Stellar Quest account from Gitpod', runLogout)
  .command(['user', 'me'], 'Print out information about yourself', {}, runUser)
  .command('open', 'Open the Stellar Quest website', runOpen)
  .command('pull', 'Pull any new or missing Quests into the /quests directory', runPull)
  .command(['play', 'quest'], 'Generate a Quest Keypair to play a Quest', runPlay)
  .command(['check', 'verify'], 'Check your Quest answer', runCheck)
  .command('submit', 'Submit a signed reward XDR to the Stellar Quest backend', runSubmit)
  // nesho? | allow the user to request new Quest Keypairs
  .demandCommand(1)
  .showHelpOnFail(false, 'Pass --help for available options')
  .alias('help', 'h')
  .strict()
  .parse()