# Workflow chart (Doug's version, authoritative)

This chart changes only when Doug changes a rule. Each edit notes the rule, with its date and time. Updated Sat Nov 21 3:06 PM ET: queue ranking is now by biggest expected impact (Doug 2:54 PM), research comes before building (Doug 2:40 PM), and the best score is now 4.17.

```mermaid
flowchart TD
    DB[(Source of truth data: every site score, win or loss, sim screens, post-mortems, idea family status)] --> Q
    WS[Wild Sim explores strange tactics only, each batch needs Doug's yes] --> ST1[Sim Tester checks: fires in 10 of 192 games, flag 0 equals champion, real edge]
    ST1 -- valuable enough --> Q
    ST1 -- not valuable --> DB
    RS[Research before building: sim data plus Mech Watcher stream data] --> MV
    MV[Movement and evasion track, sim only] --> MT[Sim Tester measures hit rate on us, Wild Sim tests stuck spots, zone and drop runs]
    MT -- survival and score improve, drops intact --> Q
    MT -- no gain --> DB
    DR[Diego research] --> Q
    Q[Idea queue ranks by biggest expected score impact, using the data; a small test goes first only if a bigger one depends on it] --> P1[Usually highest: tweaks of the best and rebuilds of site winners]
    Q --> P2[Research, Wild Sim and movement ideas that earned it]
    Q --> P3[Same family as a recent loss goes last]
    P1 --> C[Claude on my computer and Mech Builder build on current best]
    P2 --> C
    P3 --> C
    C --> D[Timing check under 30 ms and base check]
    D --> F{Any score pending on the site?}
    F -- yes --> G[Wait for the score]
    G --> F
    F -- no --> H[Submit one build, max 4 per hour]
    H --> I{Score above best?}
    I -- yes --> J[Merge as new best, currently 4.17, and rebase every queued build]
    I -- no --> K[Close PR and Sim Tester writes post-mortem]
    J --> DB
    K --> DB
```
