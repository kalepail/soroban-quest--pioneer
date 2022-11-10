# Soroban Pioneer Quest <!-- omit in toc -->

![Stellar-Quest-email](https://user-images.githubusercontent.com/4383610/200077219-de8e1f20-9878-4705-bec6-ced9a3904694.jpg)

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#ENV=prod/https://github.com/tyvdh/soroban-quest--pioneer)

## Table of Contents <!-- omit in toc -->

- [Welcome](#welcome)
- [Video Walkthrough](#video-walkthrough)
- [Gitpod](#gitpod)
  - [VS Code](#vs-code)
  - [Docker Container'd](#docker-containerd)
  - [Gitpod CLI](#gitpod-cli)
- [Stellar Quest CLI](#stellar-quest-cli)
  - [Getting New Quests](#getting-new-quests)
    - [The Easy Way](#the-easy-way)
    - [The Hard Way](#the-hard-way)
- [Rust Environment](#rust-environment)
  - [Check out the Makefile](#check-out-the-makefile)
- [Soroban CLI](#soroban-cli)
- [Futurenet](#futurenet)
- [Good Luck](#good-luck)

## Welcome

Welcome to the Pioneer Quest for our upcoming Soroban Quest! We are beyond
excited you've joined us. These quests are going to be fun, exciting, and
*interesting* to be sure! There's a lot to go through so you are up to speed,
so let's jump in!

## Video Walkthrough

The rest of this README is quite heavily skewed toward written information.
That's not everybody's primary way of learning, so we've created a video
walkthrough you can check out, as well. It doesn't contain everything in this
README, but it's a start. If that kind of content sounds like it's more up your
alley, you can [watch the video right here][video]!

[![Soroban Pioneer Quest Walkthrough][thumbnail]][video]

## Gitpod

You are reading this *from inside* a Gitpod development environment. You heard
right! A freshly baked, automated environment built just for you! A couple
things you should know about Gitpod:

### VS Code

Gitpod is built around a fully-functional copy of the VS Code IDE. Entirely in
your browser! All the things you can do in the local version of VS Code, you can
do here. Just about any extension you have in your local copy you can install
here. You get the idea.

### Docker Container'd

That's right, Gitpod is running on a Docker-ized container so that we can be
certain *your* setup for these Soroban Quests is **exactly** the same as *our*
setup! We have a few tasks configured to run on your Gitpod's startup. They're
briefly explained below, but you can also read through `.gitpod.yml` and
`.gitpod.Dockerfile` to get a sense of what is happening during
the build process.

### Gitpod CLI

Gitpod has its very own CLI that you can use to manage a running Gitpod
workspace. It's got loads of useful features, and tons of ways you can use it.
Preat neat, huh!? You can [learn all about it here][gp-cli]!

## Stellar Quest CLI

Would you belive that we've made, specifically for our Soroban Quest, a Stellar
Quest CLI?! No joke! It's *super awesome*, and **absolutely essential** for you
to understand, if you want to succeed in this live series. It's (awesomely)
called "Squirtle" but you'll become more familiar with invoking it as `sq`. The
code for it lives in the `_squirtle/` directory, but you won't need to bother
with anything in there.

It exists as a command line tool that can connect your Gitpod instance with the SQ backend. You can use it to:

- login to your Stellar Quest account using discord (or logout),
- get information about the currently logged in user,
- visit the Stellar Quest website,
- fetch new quests when they become available,
- generate a keypair to play a particular quest,
- fund Quest Keypairs on the Futurenet,
- check and/or verify the quests you've completed,
- get rewards for completing quests successfully

You can invoke `sq` from within any of the bash shells in this Gitpod workspace.
The output of `sq --help` is shown below, for your convenience. You can also
invoke `sq <command> --help` to get more information on how to use a particular
command.

```bash
gitpod /workspace/soroban-quest--pioneer (main) $ sq --help
sq

Commands:
  sq login          Connect your Stellar Quest account to Gitpod
  sq logout         Disconnect your Stellar Quest account from Gitpod
  sq user           Print out information about yourself           [aliases: me]
  sq open           Open the Stellar Quest website
  sq pull           Pull any new or missing Quests into the /quests directory
  sq play [index]   Generate a Quest Keypair to play a Quest
  sq fund [key]     Create and fund an account on the Futurenet
  sq check [index]  Check your Quest answer
  sq submit [xdr]   Submit a signed reward XDR to the Stellar Quest backend
  sq                                                                   [default]

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
```

### Getting New Quests

We're confident you'll be able to figure out how to use `sq` on your own, but
there *is* one part that deserves some extra attention: the mechanics around
getting a new quest when it becomes available. When we release a new quest,
there are two ways you can pull in the new information: the "easy" `sq` way, or
the "hard" `git` way.

#### The Easy Way

All you'll need to do is run `sq pull` from within any of the bash shells in the
workspace, and it will pull in all the new information for you. The CLI will
attempt to save any changes you've made to the directory, as well.

#### The Hard Way

If you're a `git` pro, this might be right up your alley. Essentially, what you
need to do is fetch from the origin and incorporate the changes within the
`quests/` directory into your working tree. If you want to use the same sequence
of git commands that the SQ CLI uses, here's what it does:

```bash
git stash
git fetch --all
git checkout origin/main --theirs /workspace/<the-workspace-name>/quests/
git stash pop
```

There may be some conflict cleanup required, depending on the current state of
your working tree when you run those commands. You could also skip the `stash`
steps if you don't care to save existing changes within the `quests/` directory.

## Rust Environment

Crucially toward the goal of writing smart contracts for Soroban, your workspace
contains a fully configured, ready to go Rust development environment. We have
all the tooling, compilers, build processes, and anything else you'll need to
hit the ground running. This includes:

- An up-to-date version of the [Rust][rust] programming language
- This pre-configured [VS Code][vscode] editor, with some essential extensions
- The [Cargo][cargo] package manager for Rust crates
- The `wasm32-unknown-unknown` target for compiling your contracts

You have enough pre-installed to write, debug, test, build, and deploy Soroban
smart contracts from right within this Gitpod workspace. We even have an example
contract ready for you to look through in the `quests/0-hello-world/` directory.

### Check out the Makefile

You may have noticed the `Makefile` present in this repository. In it, there are
comments explaining all the pre-configured build rules. To get started quickly,
you can simply run `make`, `make build`, or `make test` from within your root
workspace directory.

## Soroban CLI

Your workspace includes the Soroban CLI, as well. The Soroban CLI can execute
Soroban contracts in the same environment the contract will execute on network,
however in a local sandbox. This tool is in active development. So, conventions
and usage should be expected to change. You can always find the latest about
the [Soroban CLI here][soroban-cli]!

## Futurenet

Did you know you have access to a Stellar network node right now!? Yeah, right
here in your browser, in this workspace there's a Stellar node connected to the
"Futurenet" testing network. We've taken care of all the work so you don't have
to worry about docker images, starting the service, or anything besides learning
to make contracts!

This will come in very handy when you are ready to deploy and share your
contracts outside of the sandbox.

## Good Luck

Now that you're (at least somewhat) familiar with the lay of the land, you're
ready to get questing! Open up that Gitpod, and get to work! Most importantly,
have fun!!

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#ENV=prod/https://github.com/tyvdh/soroban-quest--pioneer)

[gp-cli]: https://www.gitpod.io/docs/references/gitpod-cli
[rust]: https://www.rust-lang.org/
[cargo]: https://doc.rust-lang.org/cargo/
[vscode]: https://code.visualstudio.com/
[soroban-cli]: https://github.com/stellar/soroban-cli
[video]: https://youtu.be/6_tgpth6U5Y
[thumbnail]: https://user-images.githubusercontent.com/2024293/201189898-dd9ae16e-698c-4b2d-b442-fec7d7222f3f.jpg

test
