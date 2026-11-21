/** Entry point: the kit's protocol loop (mechfight.ts) driving our brain (brain.ts). */
import { run } from "./mechfight.ts"
import { createBot } from "./brain.ts"

run(createBot)
