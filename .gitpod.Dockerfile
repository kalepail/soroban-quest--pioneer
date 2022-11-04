# Our customized docker image uses Gitpod's "workspace-full" image as a base.
FROM gitpod/workspace-full:2022-11-04-17-43-13

# These "RUN" shell commands are run on top of the "workspace-full" image, and
# then committed as a new image which will be used for the next steps.
# In this chunk of "RUN" instructions, we are downloading:
# - The Soroban CLI,
# - sccache: a compiler cache that avoids running compiling tasks when possible
# - cargo-hack: a cargo subcommand with useful options for testing and such
# - cargo-watch: a tool to watch your project and run commands when files change
# - deno: a JavaScript runtime built in Rust (we use this for the SQ cli)
RUN mkdir -p ~/.local/bin
RUN curl -L https://github.com/stellar/soroban-cli/releases/download/v0.1.2/soroban-cli-0.1.2-x86_64-unknown-linux-gnu.tar.gz | tar xz -C ~/.local/bin soroban
RUN curl -L https://github.com/mozilla/sccache/releases/download/v0.3.0/sccache-v0.3.0-x86_64-unknown-linux-musl.tar.gz | tar xz --strip-components 1 -C ~/.local/bin sccache-v0.3.0-x86_64-unknown-linux-musl/sccache
RUN chmod +x ~/.local/bin/sccache
RUN curl -L https://github.com/watchexec/cargo-watch/releases/download/v8.1.2/cargo-watch-v8.1.2-x86_64-unknown-linux-gnu.tar.xz | tar xJ --strip-components 1 -C ~/.local/bin cargo-watch-v8.1.2-x86_64-unknown-linux-gnu/cargo-watch

RUN curl -LO https://github.com/denoland/deno/releases/download/v1.26.2/deno-x86_64-unknown-linux-gnu.zip
RUN unzip deno-x86_64-unknown-linux-gnu.zip -d ~/.local/bin

# These "ENV" instructions set environment variables that will be in the
# environment for all subsequent instructions in the build stage.
ENV RUSTC_WRAPPER=sccache
ENV SCCACHE_CACHE_SIZE=5G
ENV SCCACHE_DIR=/workspace/.sccache

# In this chunk of "RUN" instructions, we are getting our rust environment
# ready and prepared to write some Soroban smart contracts.
RUN rustup install stable
RUN rustup target add --toolchain stable wasm32-unknown-unknown
RUN rustup component add --toolchain stable rust-src
RUN rustup install nightly
RUN rustup target add --toolchain nightly wasm32-unknown-unknown
RUN rustup component add --toolchain nightly rust-src
RUN rustup default stable

# In this final "RUN" instruction, we are installing a compiler and toolchain
# library for WebAssembly.
RUN sudo apt-get update && sudo apt-get install -y binaryen