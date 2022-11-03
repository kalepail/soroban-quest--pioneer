# If you just invoke `make` without any arguments from within the repository
# root (which is /workspace/soroban-pioneer-quest, by the way), it will run the
# `build` rule by default.
default: build

# If you invoke `make all` from within the repository root, it will run the
# `build` rule, immediately followed by the `test` rule. It's as if you were
# running these two rules, one after the other. These rules are defined below.
all: build test

# The `make test` rule will invoke `cargo test` using the cargo-hack subcommand.
# The `hack --feature-powerset` is useful to check that every combination of
# features is working properly.
test: build
	cargo test

# The `make build` rule will invoke `cargo build` with our WebAssemply target
# and our release profile defined in our `/Cargo.toml` file.
build:
	cargo build --target wasm32-unknown-unknown --release

# The `make watch` rule will use the cargo-watch subcommand to watch for any
# file changes, re-invoking the default `make` rule when changes are detected.
watch:
	cargo watch --clear --watch-when-idle --shell '$(MAKE)'

# The `make fmt` rule will use "Rustfmt" to apply code styling and syntactical
# rules to all the files in the directory.
fmt:
	cargo fmt --all

# The `make clean` rule will remove generated artifacts from the target
# directory that have been previously generated. Run without any options (as it
# is here), the entire target directory will be deleted.
clean:
	cargo clean
