# P40d postmortem (12:23 AM ET Sun Nov 22)
1. Expected: near-miss data test. In sim the landing exit removed P40b's wedge on seed 3014 and raised drop arrivals 5->7 and survivors 3->4 on 4000+5000. It hit one veto: early deaths 38->39 on seed 5083, the same seed that flagged P40b.
2. What happened: site 4.35 (BB-97019487) vs champion P48 at 4.44. LOSS. Sim means were -0.109 / +0.047.
3. Supported: the rooftop jet route does not help on the site (P40b 4.29 on P34, P40d 4.35 on P48). Possible but unproven: the early-death veto was right both times.
4. Moved: rooftop jet route family retired. The early-death veto stays trusted (both near misses it flagged lost). The drop-ring veto is still the only veto with sim false negatives (P34, P48).
5. Next: Sim Tester screens P52 #169, P47 #171, P49 #172; the loop submits the first READY build or eligible near miss.
