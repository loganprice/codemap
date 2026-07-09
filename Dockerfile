# --- Stage 1: Build Stage ---
FROM oven/bun:alpine AS builder

# Install ca-certificates (needed for SSL/TLS) and git
RUN apk add --no-cache ca-certificates git

WORKDIR /app

# Copy dependency definition
COPY package.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Compile application into a single executable binary
RUN bun build ./bin/code-survey.ts --compile --outfile code-survey

# Prepare the scratch distribution root
RUN mkdir -p /dist/etc/ssl/certs \
    && mkdir -p /dist/app/node_modules/tree-sitter-wasms/out

# Copy CA certificates for HTTPS requests (e.g. downloading WASM grammars from CDN or git cloning)
RUN cp -L /etc/ssl/certs/ca-certificates.crt /dist/etc/ssl/certs/ca-certificates.crt

# Copy the compiled binary
RUN cp /app/code-survey /dist/app/code-survey

# Copy WASM grammar files
RUN cp -R node_modules/tree-sitter-wasms/out/* /dist/app/node_modules/tree-sitter-wasms/out/

# Copy all dynamic library dependencies of the compiled binary
RUN for lib in $(ldd /app/code-survey | grep "=>" | awk '{print $3}'); do \
      dir=$(dirname "$lib"); \
      mkdir -p "/dist$dir"; \
      cp -L "$lib" "/dist$lib"; \
    done

# Copy the dynamic linker (loader) itself
RUN ldr=$(ldd /app/code-survey | grep '/lib/' | head -n 1 | awk '{print $1}'); \
    if [ -n "$ldr" ]; then \
      dir=$(dirname "$ldr"); \
      mkdir -p "/dist$dir"; \
      cp -L "$ldr" "/dist$ldr"; \
    fi

# --- Stage 2: Final Stage ---
FROM scratch

# Set working directory to /app
WORKDIR /app

# Copy everything from the prepared staging directory
COPY --from=builder /dist /

# Define entrypoint to run code-survey
ENTRYPOINT ["/app/code-survey"]
