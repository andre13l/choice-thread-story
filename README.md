# PATHS

**Every choice changes your path.**

PATHS is a replayable decision-based simulation game where players experience different life and career paths through a sequence of choices, probabilities and long-term consequences.

The first playable path is **Hollywood**, where the player starts as an unknown 18-year-old actor and tries to build a career in an unpredictable industry.

**Live:** https://choice-thread-story.lovable.app

## The idea

PATHS is built around a simple loop:

**Situation → Decision → Outcome → Next situation**

Each decision can affect the player's career immediately or influence events much later in the run.

There is no fixed sequence of choices that produces the "best" career. Outcomes combine player decisions, character attributes, previous events and randomness, so two similar runs can develop very differently.

A typical Hollywood run takes around **3–5 minutes** and contains roughly **20–30 decisions**.

## Hollywood

The Hollywood path simulates a career across several possible stages, including:

* auditions and early acting jobs
* independent films and television
* major studio productions
* awards and public recognition
* agents, directors and industry relationships
* producing and directing
* investments and production companies
* career setbacks and comebacks
* financial and reputational risks

Success also creates new risks. Becoming wealthy or famous does not remove the possibility of career decline, bad investments, failed productions or other long-term consequences.

The goal is to make each career feel like its own story rather than a sequence with a predetermined optimal solution.

## Event engine

The game logic is separated from the UI through a reusable, data-driven event system.

Events can define:

* age and state requirements
* weighted eligibility
* visible and hidden probabilities
* stat modifiers
* multiple outcomes
* career flags
* follow-up events
* financial and reputation effects

The engine evaluates the current career state, determines which events are eligible and selects between them using weighted probabilities.

This makes it possible to add new scenarios without hardcoding game logic into React components and provides a foundation for adding completely different PATHS in the future.

## Career state and memory

Each career tracks both visible and hidden attributes.

Visible information includes values such as:

* age
* money
* fame
* career achievements

Internally, the simulation also tracks attributes such as reputation, connections, industry respect, burnout, ego, risk tolerance and cultural impact.

The game also keeps a history of previous decisions. Events later in a career can therefore depend on choices made much earlier in the run.

A relationship created at 22, for example, can influence an opportunity decades later.

## Probability system

Displayed probabilities are only part of the simulation.

The actual probability of an outcome can also depend on the current character and career state.

Conceptually:

```text
Base probability
        +
Talent / reputation / connections
        +
Hidden character and career modifiers
        +
Randomness
        ↓
Actual outcome probability
```

Good decisions can improve expected outcomes, but no strategy guarantees a particular career.

## Tech

* React
* TypeScript
* Vite
* localStorage for career persistence
* Data-driven event engine

The current version deliberately avoids authentication and backend infrastructure while the core gameplay loop is being validated.

The application is structured so that a backend can later support global statistics, accounts, verified careers, leaderboards and other cross-player functionality.

## Current status

PATHS is currently an early playable prototype focused on one question:

> **Is playing another path irresistible?**

The Hollywood path is the first test of that concept. Future paths could use the same underlying simulation engine for completely different careers and environments.

## Development

```bash
git clone <repository-url>
cd <repository-name>
npm install
npm run dev
```

## Built with AI

PATHS was developed using **Lovable** as an AI-assisted development environment.

I used it to accelerate implementation while defining the product concept, game mechanics, simulation rules, architecture and iteration direction. The project is synced with GitHub and can also be developed locally.
