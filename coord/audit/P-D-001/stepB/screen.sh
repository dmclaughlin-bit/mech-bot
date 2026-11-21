#!/bin/bash
# screen.sh <tag> <DROP_RUN_M>
S=/tmp/claude-0/-home-claude/2ba0cd55-6afb-54e8-83da-585edfc9793b/scratchpad; export PATH=$HOME/.bun/bin:$PATH; cd $S/wt3
for B in 2000 3000 4000 5000; do d=$S/s/$1/$B; rm -rf $d; mkdir -p $d; DROP_FIRST=$3 DROP_RUN_M=$2 SEED_BASE=$B INSTR_DIR=$d bun tools/sim/run.ts --bot $S/wt3/bot.ts --seeds 96 --jobs 4 --out $S/s/$1/$B.csv --kit /tmp/claude-0/kit/mechfight-kit 2>&1 | grep matches; done
