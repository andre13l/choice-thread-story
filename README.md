# My Path Forward

Build a web game/platform called PATHS.

PATHS is a collection of short, highly replayable life and career simulations where every decision changes the player’s path.

The first playable path is:

HOLLYWOOD

The player should initially believe the goal is simply to experience a Hollywood career and achieve the best career possible.

CRITICAL PRODUCT RULE:

Never tell the player that Hollywood can be “beaten”.

Never mention:

winning

losing

victory

completion

success probability of the entire career

hidden endings

the existence of a final objective

To the player, PATHS should feel like an endless probabilistic career simulator where the goal is simply:

“How far can you make it?”

However, internally, there is an extraordinarily rare hidden ending that represents truly “beating” the Hollywood path.

Eventually, this should occur approximately once every 1,000,000 careers.



1. BRAND

The platform is called:

PATHS

Main tagline:

Every choice changes your path.

The brand should feel mysterious, minimal, premium and slightly cinematic.

Avoid:

cartoon visuals

traditional mobile-game aesthetics

casino visuals

excessive gradients

bright gaming colors

unnecessary illustrations

cluttered dashboards

Use:

white / warm off-white backgrounds

black or near-black typography

subtle gray borders

elegant typography

restrained animations

occasional red accents for dangerous decisions

lots of whitespace

The interface should feel closer to a beautifully designed editorial website than a traditional game.

PATHS should feel intriguing before the player even understands what it is.



2. HOME PAGE

Create an extremely simple landing page.

Large centered logo:

PATHS

Below:

Every choice changes your path.

Then:

Choose a path.

Show one available path:

🎬

HOLLYWOOD

How far can you make it?

Button:

START

Also show several future paths as locked or “Coming Soon”, for example:

MUSIC
FOOTBALL
BUSINESS
RACING

Do not make these functional yet.

Do not mention challenges.

Do not mention winning.

Do not mention difficulty.



3. HOLLYWOOD INTRO

After selecting Hollywood:

HOLLYWOOD

Everyone comes here wanting to make it.

Let’s see what happens to you.

Button:

BEGIN

Then generate the player’s starting character.

Starting age:

18

Starting visible stats approximately:

Money: $500
Fame: 0
Connections: 5

Talent should be generated randomly.

Do not show every underlying stat.



4. PLAYER STATE

Internally track attributes including:

age
money
fame
talent
reputation
connections
influence
legacy
industryRespect
careerEarnings
movies
leadingRoles
oscars
awards
successfulMovies
failedMovies

Also track hidden attributes:

luck
ego
publicPerception
financialRisk
burnout
culturalImpact
riskTolerance

Some attributes should never be directly visible to the player.

The player should gradually develop theories about how the game works without ever having perfect information.



5. CORE GAME LOOP

Every turn presents a short situation.

Example:

Los Angeles, 2007

You’re working nights at a restaurant.

One of your customers tells you they’re casting an actor for a terrible low-budget horror movie tomorrow morning.

You have a shift.

Option A:

Skip work and audition

12% chance

Option B:

Keep your shift

Safe

The player selects one.

Pause briefly.

Reveal the outcome.

Example:

You got the part.

The movie is terrible.

Nobody cares.

But someone on set remembers your name.

+$800
+4 Fame
+3 Connections

CONTINUE

Keep this interaction extremely fast.

Situation → decision → outcome → next situation.



6. PROBABILITIES

Probability is central to PATHS.

Decisions can display information such as:

12%

43%

Very unlikely

Risky

Good chance

Safe

But displayed probabilities do NOT necessarily represent the complete internal probability.

Example:

Base chance:
15%

Modifiers:

Talent

Connections

Industry Respect

Reputation

Luck

Burnout

Ego

The real chance should be calculated dynamically.

Therefore:

Two players can receive the same event and choose the same option but receive different outcomes.

Even the same player choosing the same decisions in another career should not necessarily get the same result.



7. NO FIXED SOLUTION

This is one of the most important rules in the entire game.

There must NEVER be a sequence like:

A → B → B → C → A = perfect career.

Player decisions should affect expected value.

Good strategy should matter.

But randomness must always matter too.

An experienced player who understands Hollywood should dramatically improve their chances of having an extraordinary career.

However:

No strategy can guarantee an extraordinary career.

The game should create debate.

Players should eventually argue about things such as:

“Connections early game is better than money.”

“Indie movies are the best way to build reputation.”

“Never start a production company before 40.”

“You need to take stupid risks if you want an insane career.”

The game itself should never confirm these theories.



8. CAREER PROGRESSION

Careers should naturally move through possible stages such as:

Unknown actor

Extra

Commercial actor

Low-budget movies

TV actor

Supporting movie roles

Indie actor

Lead actor

Streaming success

Major studio movies

Blockbusters

Franchises

Award campaigns

A-list celebrity

Producer

Production company owner

Director

Investor

Industry legend

But progress is NEVER guaranteed.

Players can move backwards.

A superstar can become irrelevant.

A failed actor can suddenly become famous at 47.

A billionaire can become bankrupt.

An actor with almost no talent can become famous.

An incredibly talented actor can spend their entire career unknown.



9. CAREER MEMORY

Events should remember previous decisions.

This is essential.

A decision at age 22 may return at age 51.

Example:

At 23:

A young unknown director offers you a role in a strange independent movie.

You reject it.

Twenty years later:

Remember that $40k indie movie you rejected?

It made $620M.

The actor who replaced you just won his third Oscar.

Or:

An assistant you treated badly early in your career eventually becomes a powerful studio executive.

Or:

A director you took a chance on becomes famous and offers you another role decades later.

Create a career history system that events can query.



10. SUCCESS MUST CREATE DANGER

The game should become particularly interesting when the player becomes extremely successful.

Being rich and famous should NOT mean the game is effectively finished.

In fact, success should unlock much larger risks.

Example:

Age 52

Net Worth: $284M
Oscars: 3
Fame: 98

Your production company receives a script from an unknown director.

Every major studio rejected it.

Budget required:

$180M

Options:

Finance it yourself

Extremely risky

Find outside investors

Difficult

Walk away

Safe

Financing it could:

create one of the greatest movies ever made

dramatically increase legacy

unlock future opportunities

OR

lose $150M+

destroy the production company

create debt

begin a chain of events ending in bankruptcy

The most legendary careers should require taking some extraordinary risks.

Playing safely should often create a good career.

It should almost never create a legendary one.



11. FALL FROM THE TOP

A defining characteristic of PATHS should be:

You are never safe.

Someone can reach:

$400M net worth

4 Oscars

Global fame

A successful production company

…and still end their path almost completely ruined.

Possible late-career disasters:

Production company bankruptcy

Massive box-office bomb

Terrible investments

Lawsuits

Tax problems

Divorce settlements

Career-ending controversy

Studio conflicts

Being blacklisted

Extreme lifestyle spending

Several consecutive failed movies

Failed comeback

Bad directorial debut

Losing cultural relevance

Being replaced by younger actors

Bad business partners

Personal projects consuming enormous amounts of money

These events should be connected to previous decisions and player attributes.

They should not feel like completely arbitrary punishment.



12. ENDINGS

Most careers eventually end.

Never display:

YOU LOST

Instead:

YOUR PATH

Age: 73

Movies: 47
Leading Roles: 14
Oscars: 2
Career Earnings: $214,600,000
Peak Net Worth: $176,200,000
Final Net Worth: $3,400,000
Peak Fame: 97

CAREER SCORE

94,281

TOP 0.12%

Then:

LIVE ANOTHER PATH

and

SHARE

Possible career descriptions include:

Forgotten Actor

Cult Icon

Hollywood Survivor

Former Superstar

Award-Winning Actor

Box Office King

Critically Acclaimed

Rich and Forgotten

Bankrupt Producer

Hollywood Mogul

Beloved Veteran

Controversial Icon

These are NOT wins or losses.

They simply describe the path the player lived.



13. THE SECRET

There is something the player does not know.

Hollywood can actually be beaten.

Do not communicate this anywhere in the public interface.

Do not show:

0 winners

Completion rate

Hall of Fame

Win probability

Secret achievements

Progress toward victory

Nothing.

For potentially millions of careers, players should simply believe PATHS is about getting the highest possible career score.



14. SECRET LEGEND ENDING

Internally create a hidden ultra-rare ending.

Eventually the target probability across all players should be approximately:

1 in 1,000,000 careers

But DO NOT implement:

random() < 0.000001

The player must first build an extraordinary career.

Possible hidden requirements should involve combinations of:

Extremely high Legacy

Extremely high Cultural Impact

Extremely high Industry Respect

Major Fame

Major Wealth

Multiple Oscars

Rare successful movies

Important relationships

Rare historical career events

Successful high-risk decisions

Long-term reputation

Surviving major career disasters

Specific hidden career flags

Only after reaching an extraordinary internal state should the player become eligible for several rare final events.

Therefore skill can dramatically improve the probability of reaching the conditions.

But even an optimal player cannot guarantee victory.



15. TEST MODE

Create:

TEST_MODE = true

We need to experience the secret ending while developing the game.

When TEST_MODE is true:

Make the secret ending achievable roughly once every 30–100 strong careers.

When false:

The architecture should support balancing toward approximately:

1 / 1,000,000.

Keep the actual probability configuration separate from the UI.



16. SECRET ENDING EXPERIENCE

When someone finally achieves the hidden ending, do NOT immediately show the normal career screen.

Fade the interface.

Black screen.

Small centered text:

Wait.

Pause.

Then:

This path isn’t over.

Pause.

Then:

You’ve done something almost nobody ever does.

Pause.

Large text:

LEGEND

Then:

You made it.

Eventually, once backend/global statistics exist, show:

You are the 3rd person in history to reach this ending.

and:

12,847,291 Hollywood paths have been lived.

This should feel dramatically different from every other ending in the game.



17. AFTER THE FIRST GLOBAL LEGEND

Architect the application so that eventually we can introduce a global event.

Before anyone has reached LEGEND:

There should be absolutely no indication that it exists.

Once the first legitimate player reaches it:

PATHS can reveal a new section:

LEGENDS

This will eventually become the global Hall of Fame.

Example:

HOLLYWOOD

#1
username
August 14, 2026

First person to complete the path.

But do NOT implement the public Hall of Fame yet.

Just keep the architecture flexible enough to add it later.



18. EVENT ENGINE

Do NOT hardcode the game inside React components.

Create a reusable event engine.

Events should be data-driven.

Each event should support fields similar to:

id

title

description

minAge

maxAge

requirements

excludedConditions

weight

tags

options

Each option should support:

label

displayedProbability

baseProbability

statModifiers

hiddenModifiers

outcomes

careerFlags

followUpEvents

financialEffects

reputationEffects

The engine should evaluate which events are currently eligible and randomly select among them using weights.

This architecture will eventually power:

Hollywood

Music

Football

Business

Racing

and other PATHS.



19. CONTENT

Create at least 80 unique Hollywood events for the prototype.

Prioritize variety over long writing.

Events should be short.

Usually 1–3 sentences.

Cover:

Auditions

Terrible commercials

Background acting

Low-budget horror movies

Indie movies

Streaming series

TV shows

Supporting roles

Lead roles

Blockbusters

Franchises

Sequels

Agents

Managers

Directors

Producers

Studio executives

Rival actors

Relationships

Paparazzi

Interviews

Viral moments

Social media

Controversies

Award campaigns

Oscars

Golden Globes

Critics

Box-office bombs

Unexpected hits

Cult movies

Career comebacks

Typecasting

Turning down roles

Contract negotiations

Huge salaries

Production companies

Investments

Directing

Producing

Financing movies

Lifestyle inflation

Mansions

Divorces

Tax problems

Bad investments

Retirement

Late-career comeback attempts

Create both serious and funny situations.

The writing should feel slightly cynical about Hollywood.



20. PACING

A normal Hollywood path should take approximately:

3–5 minutes

Aim for:

20–30 meaningful decisions

Do not make the player click through unnecessary screens.

Animations should generally take less than one second.

The player should constantly feel:

“I’ll just see what happens next.”



21. SHARE SYSTEM

At the end generate shareable text.

Example:

PATHS — HOLLYWOOD

🎬 46 Movies
🏆 2 Oscars
💰 Peak: $214M
⭐ 94,281 Career Score
🌎 Top 0.12%

What will your path look like?

Do not reveal hidden mechanics.

Later this should support generating a beautiful shareable image.



22. TECHNICAL ARCHITECTURE

Use:

React
TypeScript

Use localStorage for:

Current career

Career history

Previous runs

Personal best score

Number of paths lived

No authentication yet.

No Supabase yet.

No advertisements yet.

No payments yet.

No multiplayer yet.

But structure the application so Supabase can later provide:

Authentication

Global career count

Global statistics

Leaderboards

Career verification

User profiles

Career history

Hall of Fame

Anti-cheat



23. IMPORTANT DESIGN DETAIL

The user should not constantly see ten statistics.

During gameplay show only the information that matters.

For example, a subtle persistent header could show:

AGE 34

$2.4M

FAME 61

Everything else can influence the game invisibly.

When something important changes, communicate it through the outcome.

Example:

Hollywood is starting to take you seriously.

Industry Respect increased.

Rather than:

IndustryRespect: 67 → 72

The game should feel like living a story, not operating a spreadsheet.



24. FIRST VERSION PRIORITY

Do NOT overbuild infrastructure.

The priority is answering one question:

Is playing another Hollywood path irresistible?

The first version needs:

PATHS landing page

Hollywood intro

Character generation

Event engine

80+ events

Probability system

Career memory

Stat progression

Career collapse

Multiple endings

Career score

Personal percentile simulation

Share result

Try Again

Hidden LEGEND ending

TEST_MODE

Focus on making the game playable, fast, surprising and highly replayable before adding anything else.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://choice-thread-story.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1cfa2f9f-887a-4e94-bae8-290345b4637e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
