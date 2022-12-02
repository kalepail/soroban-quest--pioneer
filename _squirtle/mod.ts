import yargs from "https://deno.land/x/yargs@v17.6.0-deno/deno.ts";
import { decode } from "https://deno.land/std@0.161.0/encoding/base64.ts";
// import { process } from "https://deno.land/std@0.166.0/node/process.ts";
import { Select, Confirm, Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

const LOCAL_HORIZON = 'http://127.0.0.1:8000'
const SOROBAN_RPC_URI = '/soroban/rpc'

const runLogin = async () => {
  let env: any = await getEnv()
  let user: any

  const { AUTH_TOKEN, ENV } = env
  const isDev = ENV !== 'prod'
  const apiUrl = isDev ? 'https://api-dev.stellar.quest' : 'https://api.stellar.quest'

  if (AUTH_TOKEN)
    user = await getUser(env)

  else {
    const rulesConfirmed = await Select.prompt({
      message: "Do you agree to abide by our Official Rules?",
      options: [
        { name: "Yes", value: "yes" },
        { name: "Review", value: "open" },
        { name: "No", value: "no" },
      ],
    });

    if (rulesConfirmed === 'open') {
      await browse('https://quest.stellar.org/rules/series-5')
      .catch(printErrorBreak)
    }

    if (rulesConfirmed !== 'yes') 
      return

    const gitpodUrl = await gp({cmd: ['url', '3000']})
      .then(url => new URL(url))
      .catch(printErrorBreak)

    const discordUrl = new URL('https://discord.com/api/oauth2/authorize')
    discordUrl.searchParams.append('client_id', isDev ? '1024724391759724627' : '775714192161243161');
    discordUrl.searchParams.append('redirect_uri', `${apiUrl}/hooks/discord/code`);
    discordUrl.searchParams.append('response_type', 'code');
    discordUrl.searchParams.append('scope', 'identify email connections');
    discordUrl.searchParams.append('prompt', 'consent');
    discordUrl.searchParams.append('state', gitpodUrl.toString());

    await browse(discordUrl.toString())

    // await until gp env includes AUTH_TOKEN (or timeout after 5 minutes??)
    user = await new Promise((resolve) => {
      const interval = setInterval(async () => {
        env = await getEnv()
        const { AUTH_TOKEN } = env

        if (AUTH_TOKEN) {
          clearInterval(interval)
          resolve(getUser(env))
        }
      }, 5000)
    })
  }

  await runUser(null, user, env)
}

const browse = (location: string): Promise<Deno.ProcessStatus> => {
  return new Promise<Deno.ProcessStatus>((resolve, reject) => {
    // switch(process.platform) {
    //   case 'linux':
        return gp({
          cmd: ['preview', '--external', location],
          stderr: 'null',
          stdout: 'null',
        })
        .then(() => resolve({success: true, code: 0}))
        .catch(reject)
        // .catch(() => {})
        /* falls through in case 'gp' is not available */
      // case 'aix':
      // case 'freebsd':
      // case 'openbsd':
      //   return Deno.run({
      //     cmd: ['xdg-open', location],
      //     stderr: 'null',
      //     stdout: 'null',
      //   }).status()
      //   .then(resolve)
      //   .catch(reject)
      // case 'darwin':
      //   return Deno.run({
      //     cmd: ['open', location],
      //     stderr: 'null',
      //     stdout: 'null',
      //   }).status()
      //   .then(resolve)
      //   .catch(reject)
      // case 'win32':
      //   return Deno.run({
      //     cmd: ['cmd', '/c', 'start', location],
      //     stderr: 'null',
      //     stdout: 'null',
      //   }).status()
      //   .then(resolve)
      //   .catch(reject)
    // }
  })
}

const runLogout = async (
  _: any, 
  internal = false
) => {
  const { AUTH_TOKEN, ENV } = await getEnv()
  if (!AUTH_TOKEN)
    return
  const run1 = gp({
    cmd: ['env', '-u', 'AUTH_TOKEN'],
  })
  const run2 = gp({
    cmd: ['env', '-u', 'ACCESS_TOKEN'],
  })
  const run3 = gp({
    cmd: ['env', '-u', 'CLAIM_TOKEN'],
  })
  const run4 = gp({
    cmd: ['env', '-u', 'REFRESH_TOKEN'],
  })

  await Promise.all([
    run1,
    run2,
    run3,
    run4,
  ]).catch(() => {})

  if (!internal)
    console.log('👋 Bye bye');
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
  console.log(`✅ Successfully authenticated ${user.discord.username}#${user.discord.discriminator}`);
  console.log(`-----------------------------`);

  let missing = false

  if (user.isBlocked)
    if (user.isBlocked.length === 56)
      console.log(`   ❌${user.isBlocked === user.pk ? '' : ' Previous'} Stellar wallet (${user.isBlocked}) has been flagged`);
    else if (user.isBlocked === user.sub)
      console.log(`   ❌ Your account (${user.isBlocked}) has been flagged`);
    else
      console.log(`   ❌ You have been flagged`);
  else if (user.pk)
    console.log(`   ✅ Stellar wallet ${user.pk.substring(0, 6)}...${user.pk.substring(user.pk.length - 6)} is connected`);
  else {
    missing = true
    console.log(`   ❌ Please connect your Stellar wallet`);
  }

  if (
    (user.kyc.ofac ? user.kyc.ofac.replace(/\W/g, '_') === 'no_match' : true)
    && user.kyc.status === 'approved'
  ) console.log(`   ✅ KYC flow has been completed`);
  else {
    missing = true
    console.log(`   ❌ Please complete the KYC flow`);
  }

  if (
    user.taxStatus === 'accepted'
    || user.taxStatus === 'pending'
    || user.taxStatus === 'completed' 
    || (user.taxStatus === 'requested' && user.tax) // Fix for folks with an 'accepted' TAX doc but somehow got back into a `requested' taxStatus
  ) console.log(`   ✅ Tax documents have been uploaded`);
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

    await browse(`${siteUrl}/settings`)
  }
}

const runOpen = async () => {
  const env = await getEnv()

  const { ENV } = env
  const isDev = ENV !== 'prod'
  const siteUrl = isDev ? 'https://quest-dev.stellar.org' : 'https://quest.stellar.org'

  browse(siteUrl)
}

const runPull = async () => {
  const run1 = Deno.run({
    cmd: ['git', 'stash',],
  })
  await run1.status()

  const run2 = Deno.run({
    cmd: ['git', 'fetch', '--all'],
  })
  await run2.status()

  const run3 = Deno.run({
    cmd: ['git', 'pull', '-X', 'theirs']
  })
  await run3.status()

  const run4 = Deno.run({
    cmd: ['git', 'stash', 'pop'],
  })
  await run4.status()

  await openLatestReadme()
}

const runPlay = async (argv: any) => {
  if (!argv.index)
    throw '--index argument must be a positive integer'

  const index = argv.index - 1 // flag isn't zero indexed but the API is

  const env = await getEnv()
  const { checkToken } = await getCheckToken(index, env)

  const { pk, sk }: { pk: string, sk: string } = JSON.parse(
    new TextDecoder().decode(
      decode(
        checkToken.split('.')[1]
      )
    )
  )

  await getDotFilesLocation()
    .then((location: string) => Deno.writeFile(`${location}/.soroban-secret-key`, new TextEncoder().encode(sk)))

  console.log(`🔐 Quest Keypair for Stellar Quest Series 5 Quest ${argv.index}
✅ SOROBAN_SECRET_KEY environment variable has been updated
------------------------------------------
Public Key: ${pk} (don't forget to fund me)
Secret Key: ${sk}`)

  await autoFund(pk)
}

const runFund = async (argv: any) => {
  if (await isAccountFunded(argv.addr))
    return console.log('👀 Your account has already been funded.')

  return doFund(argv.addr)
}

const runCheck = async (argv: any) => {
  if (!argv.index)
    throw '--index argument must be a positive integer'

  const index = argv.index - 1 // flag isn't zero indexed but the API is

  const env = await getEnv()
  const user = await getUser(env)

  const { ENV } = env
  const isDev = ENV !== 'prod'
  const siteUrl = isDev ? 'https://quest-dev.stellar.org' : 'https://quest.stellar.org'
  
  if (!user.pk) {
    const missingPkConfirmed = await Confirm.prompt(`You have not yet connected your Stellar wallet. 
   This will affect your ability to claim NFT and XLM rewards.
   Would you like to connect your Stellar wallet?`);

    if (missingPkConfirmed) {
      return browse(`${siteUrl}/settings`)
    }
  }

  else if (
    !(
      user.taxStatus === 'accepted'
      || user.taxStatus === 'pending'
      || user.taxStatus === 'completed' 
      || (user.taxStatus === 'requested' && user.tax)
    ) || !(
      (user.kyc.ofac ? user.kyc.ofac.replace(/\W/g, '_') === 'no_match' : true)
      && user.kyc.status === 'approved'
    )
  ) {
    const missingPkConfirmed = await Confirm.prompt(`You have not yet completed the KYC flow and/or uploaded your tax documents.
   This will affect your ability to claim XLM rewards.
   Would you like to complete your Stellar Quest account?`);

    if (missingPkConfirmed) {
      return browse(`${siteUrl}/settings`)
    }
  }

  const { checkToken } = await getCheckToken(index, env)
  const claimToken = await getClaimToken(checkToken, env)

  if (!claimToken) // No claim token but also no error, you've already solved
    return console.log("🎉 Correct! 🧠");

  await gp({
    cmd: ['env', `CLAIM_TOKEN=${claimToken}`]
  })

  const { xdr, key, network, place, amount } = JSON.parse(
    new TextDecoder().decode(
      decode(
        claimToken.split('.')[1]
      )
    )
  )

  if (!xdr) // In the case of anon or pk'less accounts
    return console.log("🎉 Correct! 🧠");

  let message = "🎉 Correct!"

  if (parseInt(place) >= 0) {
    message += ` You took place ${place + 1}`

    if (amount)
      message += ` and won ${amount} XLM`

    message += ` ${place <= 2 ? '🏆' : '🏅'}${amount ? '💰' : ''}`
  }

  console.log(message);

  const signPrompt = await Select.prompt({
    message: 'How would you like to sign your reward transaction?',
    options: [
      { name: "Albedo", value: "albedo" },
      { name: "Raw XDR", value: "xdr" },
    ],
  });

  if (signPrompt === 'albedo') {
    const gitpodUrl = await gp({cmd: ['url', '3000']})
      .then(url => new URL(url))
      .catch(printErrorBreak)
    gitpodUrl.searchParams.append('xdr', xdr)
    gitpodUrl.searchParams.append('pubkey', user.pk) // || key) // let's try this for a bit
    gitpodUrl.searchParams.append('network', network.toLowerCase())

    return browse(gitpodUrl.toString())
  }

  else if (signPrompt === 'xdr') {
    console.log(`-----------------------------`);
    console.log(`✅ Find the unsigned reward XDR below.`);
    console.log(`   You can sign it wherever you please (e.g. Laboratory)`);
    console.log(`   however you MUST submit that signed XDR back here with`);
    console.log(`   sq submit <signed_xdr>`);
    console.log(`-----------------------------`);
    console.log(xdr);
  }
}

const runSubmit = async (argv: any) => {
  const env = await getEnv()
  const { CLAIM_TOKEN } = env

  await submitClaimToken(CLAIM_TOKEN, argv.xdr, env)
    .then(() => {
      const { hash } = JSON.parse(
        new TextDecoder().decode(
          decode(
            CLAIM_TOKEN.split('.')[1]
          )
        )
      )

      console.log(`✅ Transaction ${hash} submitted!`)
    })
    .catch(async (err) => {
      const { claimToken } = err

      if (claimToken) {
        await gp({cmd: ['env', `CLAIM_TOKEN=${claimToken}`]})

        const { xdr } = JSON.parse(
          new TextDecoder().decode(
            decode(
              claimToken.split('.')[1]
            )
          )
        )

        console.log('❌ Transaction submission failed but a new XDR has been generated. Please sign it and try again');
        console.log(xdr);
      } else printErrorBreak(err)
    })
}

const runRPC = async (argv: any) => {
  if (argv.change)
    return selectRPCEndpoint()

  const horizon = await getHorizonEndpoint()
  const ready = await getRPCStatus(horizon)
  const selectedRpcEndpoint = `${horizon}${SOROBAN_RPC_URI}`

  let statusMessage = ''

  // TODO if we're ready but using a SOROBAN_RPC_URL that isn't the Gitpod's ask if we want to revert (or maybe just revert automatically?)

  if (ready) {
    statusMessage = '📡'

    if (!argv.short)
      statusMessage += ` Your selected RPC endpoint (${selectedRpcEndpoint}) is ready!`
    
    console.log(statusMessage)
  } 
  
  else {
    statusMessage = '⏳'
    
    if (!argv.short)
      statusMessage += ` Your selected RPC endpoint (${selectedRpcEndpoint}) is not yet ready`

    console.log(statusMessage)

    if (!argv.short)
      return selectRPCEndpoint()
  }
}

const runHelp = async () => {
  const run1 = Deno.run({
    cmd: ['sq', 'help'],
  })
  await run1.status()
}

const gp = (opts: Deno.RunOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const cmd: readonly string[] = ['gp', ...(opts.cmd as string[]??[])]
      const runOpts = {
        cmd,
        cwd: opts.cwd,
        stdout: opts.stdout??'piped',
        stderr: opts.stderr??'piped',
      }
      const gpProcess = Deno.run(runOpts)
      Promise.all([
        gpProcess.status(),
        runOpts.stdout === 'piped' ? gpProcess.output() : undefined,
        runOpts.stderr === 'piped' ? gpProcess.stderrOutput() : undefined,
      ])
      .then(([status, stdout, stderr]) => {
        if (status.success) {
          resolve(new TextDecoder().decode(stdout).trim())
        } else {
          reject({...status, stderr: new TextDecoder().decode(stderr)})
        }
      })
      .finally(() => {
        gpProcess.close();
      })
    } catch (e) {
      if (e == 'NotFound: No such file or directory (os error 2)') {
        reject("command 'gp' is only available in a gitpod")
      }
      reject(e)
    }
  })
}

const getDotFilesLocation = async () => {
  const url = await gp({cmd: ['url']})
  .catch(() => {})

  if (url?.indexOf('gitpod.io') !== -1) {
    return '/workspace'
  }

  return await getRootDir()
}

const getRootDir = async () => {
  return await Deno.run({
    cmd: ['git', 'rev-parse', '--show-toplevel'],
    stdout: "piped",
  })
  .output()
  .then((path: BufferSource) => new TextDecoder().decode(path).trim())
  .then((path: string) => Deno.realPathSync(path))
}

const openLatestReadme = async () => {
  const rootDir = await getRootDir()
  
  const latestReadme = await Deno.run({
    cwd: rootDir,
    cmd: ['find', 'quests', '-name', 'README.md'],
    stdout: "piped",
  })
  .output()
  .then((output: BufferSource) => new TextDecoder().decode(output)
    .trim()
    .split("\n")
    .pop()??'')

  await gp({
    cwd: rootDir,
    cmd: ['open', latestReadme],
  }).catch(() => {})
}

const getEnv = async () => {
  const gpEnvString = await gp({cmd: ['env']})
    .catch(() => "")

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

  const { sub } = JSON.parse(
    new TextDecoder().decode(
      decode(
        AUTH_TOKEN.split('.')[1]
      )
    )
  )

  return fetch(`${apiUrl}/user`, { 
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  })
    .then(handleResponse)
    .then((res) => ({
      sub,
      ...res
    }))
    .catch(async (err) => {
      await runLogout(null, true)
      printErrorBreak(err)
    })
}

const getCheckToken = (index: number, env: any) => {
  const { AUTH_TOKEN, ENV } = env
  const isDev = ENV !== 'prod'
  const apiUrl = isDev ? 'https://api-dev.stellar.quest' : 'https://api.stellar.quest'

  return fetch(`${apiUrl}/register/practice?series=5&index=${index}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  })
    .then(handleResponse)
    .catch(printErrorBreak)
}

const autoFund = async (pk: string) => {
  const accountIsFunded = await isAccountFunded(pk)

  if (accountIsFunded)
    return

  console.log('------------------------------------------')

  const fundDecision = await Select.prompt({
    message: "🏧 Do you want to fund this account now?",
    options: [
      { name: "💁 Yes please!", value: "yes" },
      { name: "🙅 No thanks", value: "no" },
    ],
    default: "yes"
  })

  if (fundDecision == "yes")
    return doFund(pk)
}

const getHorizonEndpoint = (): Promise<string> => {
  return getDotFilesLocation()
    .then((location: string) => Deno.readFile(`${location}/.soroban-rpc-url`))
    .then((source: BufferSource) => new TextDecoder().decode(source))
    .then(url => url.replace(new RegExp(`${SOROBAN_RPC_URI}$`, 'g'), ""))
    .catch(() => LOCAL_HORIZON)
}

const isAccountFunded = async (pk: string): Promise<boolean> => {
  return await getHorizonEndpoint()
    .then(horizon => fetch(`${horizon}/accounts/${pk}`))
    .then(({status}) => status === 200)
}

const doFund = (pk: string) => {
  return fetch(`https://friendbot-futurenet.stellar.org/?addr=${pk}`)
    .then(handleResponse)
    .catch(printErrorBreak)
}

const getRPCStatus = (horizon: string) => {
  return fetch(horizon)
    .then(handleResponse)
    .then(({ingest_latest_ledger, core_latest_ledger}) => ingest_latest_ledger === core_latest_ledger)
    .catch(() => false)
}

const selectRPCEndpoint = async () => {
  let altNet = await Select.prompt({
    message: "Would you like to switch to one of our official endpoints?",
    options: [
      { name: "No", value: "no" },
      { name: "KanayeNet", value: "https://kanaye-futurenet.stellar.quest:443/soroban/rpc" },
      { name: "nebolsin", value: "https://nebolsin-futurenet.stellar.quest:443/soroban/rpc" },
      { name: "kalepail", value: "https://kalepail-futurenet.stellar.quest:443/soroban/rpc" },
      { name: "silence", value: "https://silence-futurenet.stellar.quest:443/soroban/rpc" },
      { name: "Raph", value: "https://raph-futurenet.stellar.quest:443/soroban/rpc" },
      { name: "nesho", value: "https://nesho-futurenet.stellar.quest:443/soroban/rpc", disabled: true },
      { name: "Custom", value: "custom" },
    ],
    default: "no"
  });

  if (altNet === 'no')
    altNet = `${LOCAL_HORIZON}${SOROBAN_RPC_URI}`

  else if (altNet === 'custom') {
    const customAltNet = await Input.prompt(`Enter a custom RPC endpoint. (include the protocol, port number and /soroban/rpc path)`);

    if (
      customAltNet.length <= 'http://:65535/soroban/rpc'.length
      || !customAltNet.includes('/soroban/rpc')
    ) console.log(`❌ Invalid RPC endpoint`)
    else altNet = customAltNet
  }

  getDotFilesLocation()
    .then((location: string) => Deno.writeFile(`${location}/.soroban-rpc-url`, new TextEncoder().encode(altNet)))
}

const getClaimToken = (checkToken: string, env: any) => {
  const { ENV } = env
  const isDev = ENV !== 'prod'
  const apiUrl = isDev ? 'https://api-dev.stellar.quest' : 'https://api.stellar.quest'

  return fetch(`${apiUrl}/answer/check`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${checkToken}`
    }
  })
    .then(handleResponse)
    .catch(printErrorBreak)
}

const submitClaimToken = (claimToken: string, innerTx: string, env: any) => {
  const { ENV } = env
  const isDev = ENV !== 'prod'
  const apiUrl = isDev ? 'https://api-dev.stellar.quest' : 'https://api.stellar.quest'

  return fetch(`${apiUrl}/prize/claim`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${claimToken}`
    },
    body: JSON.stringify({
      innerTx
    })
  })
    .then(handleResponse)
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
const printErrorBreak = (error: any) => {
  if (typeof error === 'string')
    console.error(error)
  else
    console.error(JSON.stringify(error, null, 2))
  throw 0
}

yargs(Deno.args)
  .scriptName('sq')
  .command('login', 'Connect your Stellar Quest account to Gitpod', runLogin)
  .command('logout', 'Disconnect your Stellar Quest account from Gitpod', runLogout)
  .command(['user', 'me'], 'Print out information about yourself', {}, runUser)
  .command('open', 'Open the Stellar Quest website', runOpen)
  .command('pull', 'Pull any new or missing Quests into the /quests directory', runPull)
  .command(`play [index]`, 'Generate a Quest Keypair to play a Quest', (yargs: any) => yargs
    .positional('index', {
      describe: 'The index of the quest to play',
      alias: ['i', 'number', 'n', 'quest', 'q'],
    }).demandOption(['index']), runPlay)
  .command('fund [key]', 'Create and fund an account on the Futurenet', (yargs: any) => yargs
    .positional('key', {
      describe: 'The public key of the account to fund',
      alias: ['k', 'addr', 'address', 'acct', 'account']
    })
    .demandOption(['key']), runFund)
  .command('check [index]', 'Check your Quest answer', (yargs: any) => yargs
    .positional('index', {
      describe: 'The index of the quest to check',
      alias: ['i', 'number', 'n', 'quest', 'q'],
    }).demandOption(['index']), runCheck)
  .command('submit [xdr]', 'Submit a signed reward XDR to the Stellar Quest backend', (yargs: any) => yargs
    .positional('xdr', {
      describe: 'The XDR to submit to the Stellar Quest backend',
      alias: ['tx'],
    })
    .demandOption(['xdr']), runSubmit)
  .command(['rpc', 'horizon'], 'Check the status of your local RPC endpoint', (yargs: any) => yargs
    .options('change', {
      describe: 'Change the default RPC endpoint',
      alias: ['c']
    })
    .options('short', {
      describe: 'Only show the status icon',
      alias: ['s']
    }), runRPC)
  .command('*', '', {}, runHelp)
  .showHelpOnFail(false)
  .demandCommand(1)
  .help('help')
  .alias('help', 'h')
  .strict()
  .parse()
