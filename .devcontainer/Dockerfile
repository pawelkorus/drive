FROM mcr.microsoft.com/devcontainers/typescript-node:20

RUN apt-get update \
    && apt-get install -y libasound2 \
    && rm -rf /var/lib/apt/lists/*