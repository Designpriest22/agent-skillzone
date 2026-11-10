---
name: higgsfield-character-design
description: "Pre-production story-and-character development for Higgsfield projects — the upstream layer that decides WHAT to prompt before any model runs. Use when the user wants to build a character, design a world, develop a story or premise, create a character sheet / character bible / story bible, lock a visual style or 'visual DNA', plan a multi-shot narrative with consistent characters, or says 'make this character consistent across shots' or 'I keep getting generic AI characters'. Adapted from Higgsfield's official character-design framework by @vavavinca."
user-invocable: true
metadata:
  source: llmskillhub.com/osidemedia/higgsfield-character-design (v1.0.0, digest 8d6a44a)
---

# Higgsfield Character Design — Story Bible

Answers the question upstream of prompting: *what am I prompting, and why this and not generic AI slop?* Build premise, world, character, story and a locked visual style **before** writing a generation prompt.

> Framework, worksheet structure and "world first" method adapted from Higgsfield's official *Character Design* materials by **@vavavinca**.

## The method: world first
A world is a system of constraints. Order is not negotiable; each step locks an output later steps depend on:
1. PREMISE — one arguable sentence, no characters yet
2. WORLD — six dimensions, filled before anyone is cast
3. CHARACTER — 9 questions + a relationship web
4. STORY SPINE — 10–20 beats, "therefore / but", never "and then"
5. STYLE SHEET — palette + lighting + materials + a FORBIDDEN list (the Visual DNA)
6. HAND OFF — feed the locked sheets into the prompt + a model

If the user arrives mid-stream, locate where they are, check the upstream outputs exist, and fill the missing layer.

## Step 1 — Premise
Theme statement (a claim, not a logline) · what it argues · the counter-argument (or the theme is propaganda) · emotional promise (one word + one line). Pressure test: one sentence, no names, arguable, real counter-argument, names a feeling.

## Step 2 — World Sheet (six dimensions)
Physical · Social (who has power) · Economic (what's scarce) · Ideological (sacred / shameful) · Historical (what everyone remembers) · Sensory (daily textures). Every answer specific; lock it before casting.

## Step 3 — Character: the 9-Question Sheet
Header: name, age, world, archetype. Then: 1 thematic role · 2 external goal (specific, currently impossible) · 3 internal goal · 4 psychological need (flaw that hurts them) · 5 moral need (flaw that hurts others) · 6 wound (specific past event) · 7 spark (event that taught them what to become) · 8 silhouette (what their shape says across a room) · 9 contradiction. Vague answers are the enemy: only *this* character should be able to give them.

**Character web:** Opponent, Ally, Mentor, Foil. If removing a spoke changes nothing, the web is too thin.

## Step 4 — Story Spine
`Beat N: [character] [does/discovers/loses] [thing]. Result: [next problem].` Connect with "therefore"/"but". Mark the midpoint turn. Stop when the premise is proven.

## Step 5 — Style Sheet (Visual DNA + Forbidden List)
Lock once, inject verbatim into every prompt: **palette** (5–7 hex codes, inject the hex), **lighting** logic, **materials**, one **juxtaposition**, **age & proportion** language, 2–3 real-life look refs. **The Forbidden List is the most valuable field**: name what the world is NOT. It is the strongest anti-slop lever.

## Step 6 — Hand off
Inject Visual DNA (hex + forbidden list) verbatim; take the subject from Silhouette + Contradiction and the action from the story beat. For recurring characters use an identity lock (reference image / Soul ID) rather than re-rolling one-offs. Ship the bible as one reusable canon document; give each recurring character a fixed **voice lock** and **movement lock** line reused verbatim.

## Sheet construction laws
- **Plain grey background, always**: no set, no gradient.
- Creature sheets: two head close-ups, mouth open and closed.
- **Face-lock crop**: crop heads out of full-body panels so one close-up is the single source of truth for the face.
- Scale between subjects: a landmark sentence and/or a size-ref frame; if uncertain, render the smaller subject smaller.
- Fix a flawed sheet with a targeted edit; don't rebuild it.

## Screen test
Before paying for scenes, audition the character in motion: casting read → 3–6 role options (each states what it must prove) → three playable lines → three voice triggers (≤3 qualities each) → user picks → one simple, locked-camera audition prompt. Lock the winning take's identity.

## Anti-generic drills
- **Always ask why** until the answer surprises you.
- **One wound, two characters**: pick the less obvious reaction.
- **Silhouette test**: recognisable from shape alone, or the design is generic.

## Hard vs soft worldbuilding
Hard (explicit, consistent rules) when the audience must master them; soft (atmosphere, wonder) otherwise.
