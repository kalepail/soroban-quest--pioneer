# Soroban Pioneer Quest

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#ENV=dev/https://github.com/tyvdh/soroban-pioneer-quest)

# Welcome!

Welcome to the Pioneer Quest for our upcoming Soroban Quest! We are beyond
excited you've joined us. These quests are going to be fun, exciting, and
*interesting* to be sure! There's a lot to go through so you are up to speed,
so let's jump in!

# Gitpod

You are reading this *from inside* a Gitpod development environment. You heard
right! A freshly baked, automated environment built just for you! A couple
things you should know about Gitpod:

## VS Code

Gitpod is built around a fully-functional copy of the VS Code IDE. Entirely in
your browser! All the things you can do in the local version of VS Code, you can
do here. Any extension you have in your local copy, you can install it here. You
get the idea.

## Docker Container'd

That's right, Gitpod is running on a Docker-ized container so that we can be
certain *your* setup for these Soroban Quests is **exactly** the same as *our*
setup! We have a few tasks configured to run on your Gitpod's startup. They're
briefly explained below, but you can also read through `.gitpod.yml` and
`.gitpod.Dockerfile` to get a sense of what is happening at what point during
the build process.

## Gitpod CLI

Gitpod has its very own CLI that you can use to manage a running Gitpod
workspace. It's got loads of useful features, and tons of ways you can use it.
Preat neat, huh!? You can [learn all about it here][gp-cli]!

# Rust Environment

Most crucially toward the goal of writing smart contracts for Soroban, your
workspace contains a fully configured, ready to go Rust development environment.
We have all the tooling, compilers, build processes, and anything else you'll
need to hit the ground running. This includes:

- An up-to-date version of the [Rust][rust] programming language
- This pre-configured [VS Code][vscode] editor, with the required extensions
- The [Cargo][cargo] package manager for Rust crates
- The `wasm32-unknown-unknown` target for compiling your contracts

You have enough pre-installed to write, debug, test, build, and deploy Soroban
smart contracts from right within this Gitpod workspace. We even have an example
contract ready for you to look through in the `quests/1-hello-world/` directory.

## Check out the Makefile

You may have noticed the `Makefile` present in this repository. In it, there are
comments explaining all the pre-configured build rules. To get started quickly,
you can simply run `make`, `make build`, or `make test` from within your root
workspace directory.

# Soroban CLI

Your workspace includes the Soroban CLI, as well. The Soroban CLI can execute
Soroban contracts in the same environment the contract will execute on network,
however in a local sandbox. This tool is in active development. So, conventions
and usage should be expected to change. You can always find the latest about
the [Soroban CLI here][soroban-cli]!

# Futurenet

Did you know you have access to a Stellar network node right now!? Yeah, right
here in your browser, in this workspace there's a Stellar node connected to the
"Futurenet" testing network. We've taken care of all the work so you don't have
to worry about docker images, starting the service, or anything besides learning
to make contracts!

This will come in very handy when you are ready to deploy and share your
contracts outside of the sandbox.

[gp-cli]: https://www.gitpod.io/docs/references/gitpod-cli
[rust]: https://www.rust-lang.org/
[cargo]: https://doc.rust-lang.org/cargo/
[vscode]: https://code.visualstudio.com/
[soroban-cli]: https://github.com/stellar/soroban-cli
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#ENV=dev/https://github.com/tyvdh/soroban-pioneer-quest)
