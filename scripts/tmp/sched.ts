import { CHALLENGES } from "../../src/games/top10/bank.server";
import { scheduledChallenge } from "../../src/games/top10/top10.server";
import { shiftDate } from "../../src/games/core/dailyStats";
console.log(CHALLENGES.map(c=>c.id+":"+c.category).join("\n"));
for (let i=-8;i<=6;i++){const d=shiftDate("2026-08-21",i);const c=scheduledChallenge(d);console.log(d,c.id,"|",c.title);}
