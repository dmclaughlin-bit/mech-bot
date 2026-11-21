# mech-bot

A bot for **Mech Royale**, the Builders track of the Builders Buildathon at Ohio State (November 20–22, 2026). It reads `mechfight/1` observations on stdin and writes actions on stdout.

## Pre-existing code

This repository starts from the official mechfight bot kit on the Mech Royale track page:

- `mechfight.ts` is the kit's TypeScript wrapper.
- `brain.ts` began as the kit's `example.ts`. `bot.ts` is the entry point.
- `Dockerfile` and `package.json` come from the kit's `ts/` folder.

All work here is released under the MIT license, as the event rules require.

## Check it

With the kit unpacked next to this folder:

```sh
cd mechfight-kit
python3 check/check.py -- node ../mech-bot/bot.ts
```

In a match, the Docker image built from this folder runs `bun /bot/bot.ts` with no network, 1 CPU and 512 MB.
