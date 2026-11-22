# Noise-calibration raw data removed from main (Doug 9:08 PM ET, Sat Nov 21)
The raw data committed in e19bafd (1,567 files, about 39 MB) pushed the repo archive over the site's 20 MB limit. P34 c281bf5 was rejected unscored (receipt BB-FB8CB5AE, 9:07 PM ET). The folder is still in git history at e19bafd: `git checkout e19bafd -- coord/data/benchmarks/noise-calibration`. Result: the sim is fully deterministic, and null variants changed nothing.
Rule: raw sim output never goes on main. Keep it local or attach a summary only.
