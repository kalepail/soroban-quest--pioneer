default: build

all: build test

test: build
	cargo test

build:
	cargo build --target wasm32-unknown-unknown --release

watch:
	cargo watch --clear --watch-when-idle --shell '$(MAKE)'

fmt:
	cargo fmt --all

clean:
	cargo clean
