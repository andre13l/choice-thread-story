import { GRAPH, generateChallenge, pairKey } from "../src/games/connect/graph";
import { cachedChallengePool } from "../src/games/connect/popularity";
console.log("pool size", cachedChallengePool(GRAPH).length);
const seen = new Set<string>();
for (let i=0;i<30;i++){
  const c = generateChallenge(GRAPH,{minClicks:4,maxClicks:8,avoid:seen});
  seen.add(pairKey(c.startId,c.targetId));
  console.log(`${GRAPH.peopleById[c.startId]!.name} -> ${GRAPH.peopleById[c.targetId]!.name}  (${c.best})`);
}
