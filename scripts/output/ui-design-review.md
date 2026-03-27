# LangLab UI/UX Design Review -- 10 Design Perspectives

**Date:** 2026-03-26
**Reviewer:** Claude Opus 4.6 (automated code review)
**Scope:** Full codebase analysis of all UI components

---

## 1. Material Design (Google)

**Rating: 6/10**

### Observations

1. **Elevation system is underdeveloped.** The app uses only two shadow levels (`--shadow` and `--shadow-lg`), both very subtle. Material Design expects a 0-24dp elevation system where interactive elements like the Study button, cards, and FABs have distinct, meaningful shadows. The `study-card` and `stat-card` components use near-identical 1px shadow (`0 1px 3px rgba(0,0,0,0.04)`) making the hierarchy flat. The `btn-primary` class has zero shadow, which violates Material's expectation that raised buttons have 2dp elevation at rest and 8dp on press.

2. **Touch targets are inconsistently sized.** The grading buttons (`py-5` = ~52px height) meet the 48dp minimum, but many secondary controls fall short. The back/undo button (`py-2.5 px-5`) yields approximately 36px height. The tense tabs in `WordPopover` (`px-2 py-1` with `text-[9px]`) are roughly 24px tall -- half the minimum. The settings gear toggle (`px-3 py-1.5`) is similarly undersized. The `btn-ghost` class provides no padding specification at all in `index.css`.

3. **Color system partially aligns.** The purple accent (`#7c3aed`) serves as a workable primary, and the semantic colors (red for "Again", amber for "Hard", emerald for "Good") map well to Material's semantic layer. However, there is no secondary color defined, no surface color variant, and the dark theme uses hard-coded slate tones instead of Material's overlay-based dark surfaces. The transition between themes is handled well with the 0.25s global transition.

---

## 2. Human Interface Guidelines (Apple)

**Rating: 7/10**

### Observations

1. **Safe area handling is excellent.** The app consistently uses `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` via `pt-[max(...)]` and `pb-[max(...)]` patterns across `StudySession`, `PlacementTest`, and `ChallengeScreen`. This ensures proper rendering on notched iPhones. The `h-dvh` usage (dynamic viewport height) correctly handles the iOS Safari address bar.

2. **Navigation patterns deviate from iOS conventions.** The app uses no tab bar, no navigation controller with back-swipe, and no standard iOS navigation stack. Instead, the `view` state variable in `App.tsx` acts as a flat state machine (`HOME | TOPICS | STUDY | GAMIFICATION | SETTINGS | PLACEMENT | CHALLENGE | VOCAB`). There is no shared top navigation bar -- each view implements its own back button with inconsistent placement (left-aligned "Exit" ghost button in StudySession, left-aligned chevron in TopicMap, different text styles). HIG expects consistent navigation chrome.

3. **Blur and depth are underutilized.** The overlay modal (`bg-[var(--overlay)] backdrop-blur-sm`) in StudySession's grading guide uses a tasteful blur, but this is the only instance. The `WordPopover` portal has no backdrop at all -- it just floats over the card. HIG would recommend a subtle backdrop or vibrancy effect. The language dropdown (`stat-card` with `shadow-lg`) could benefit from the frosted-glass effect that defines iOS overlays.

---

## 3. Duolingo's Design Language

**Rating: 5/10**

### Observations

1. **No mascot, character, or personality.** Duolingo's Duo owl creates an emotional bond. LangLab has an atom icon and test-tube SVGs for boss battles, but no persistent character that encourages, celebrates, or expresses disappointment. The onboarding slides use generic emoji icons (globe, brain, star, rocket) instead of a branded character. The "lab" theme has potential (a scientist character, lab equipment metaphors) but is not exploited.

2. **Celebration moments are muted.** When a session completes, the user sees a simple checkmark icon (`&#x2713;`) inside a rounded box. Compare this to Duolingo's confetti explosions, XP animations, and sound effects. The boss battle results show emoji (crown, medals, skull) which is better, but still text-based rather than animated. The `animate-ring-reveal` on boss completion is the strongest celebration moment, but it is a simple scale animation. There is no confetti, no particle effect, no haptic feedback trigger.

3. **Progress visualization lacks the "path" metaphor.** Duolingo's skill tree is a winding path with character animations. LangLab's `TopicMap` is a plain vertical list with dots on a trunk line -- structurally similar but visually flat. The trunk line is a 2px static bar. Nodes are rectangular cards with text. There are no illustrations, no terrain, no visual rewards for completed sections. The "Experiments" trophy room in `GamificationHub` (5-column grid of numbered boxes) is functional but stark.

---

## 4. Scandinavian Minimalism

**Rating: 8/10**

### Observations

1. **Typography is strong and disciplined.** The app uses Inter for body and JetBrains Mono for numbers, both excellent choices. The `font-black` (900 weight) for headings creates confident hierarchy. The consistent use of `uppercase tracking-widest` for labels creates a cohesive typographic system. The Orbitron font for "LANGLAB" in the header adds personality without clutter. Font sizes scale rationally from `text-[8px]` (freeze labels) through `text-3xl` (settings numbers).

2. **Whitespace is generally well-managed but inconsistent.** The home screen dashboard packs stat-card, placement CTA, category focus, notification prompt, study button, vocab button, and settings into a single scrollable view. This creates a "wall of boxes" effect. Individual components have good internal spacing (the stat-card's `p-4`, the grading buttons' `gap-2`), but the vertical rhythm on the home screen lacks breathing room -- most elements use `mb-3` creating uniform, undifferentiated spacing.

3. **Color restraint is admirable.** The light theme uses only slate/gray tones (`#f8fafc` through `#1e293b`) with purple (`#7c3aed`) as the sole accent. Semantic colors (red, amber, emerald) appear only in context. The dark theme mirrors this discipline with deep navy tones (`#0f172a`). There are no gradients, no decorative patterns, no visual noise. Every colored element serves a purpose: red = danger/fail, emerald = success, amber = warning, purple = primary action. This is textbook Scandinavian restraint.

---

## 5. Gestalt Principles

**Rating: 7/10**

### Observations

1. **Proximity is well-applied within components but weak between them.** Inside the `stat-card`, the streak flame, current topic, and progress bar form a clear visual group. Inside `StudySession`, the new/learn/review counters are tightly grouped in a bordered container. However, on the home screen, the placement test banner, category focus grid, and study button all share the same `mb-3` spacing, making them feel like a flat list rather than grouped sections. The "Vocab Focus" section and the study button should be separated by a larger gap to signal they belong to different groups.

2. **Similarity is consistent.** All interactive cards share the `stat-card` style (white background, 1px border, 12px radius). All buttons follow one of two patterns: `btn-primary` (filled purple) or bordered ghost-style. The `text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest` label pattern appears everywhere (settings headers, section labels, badge text), creating strong visual consistency. The grading buttons in `StudySession` use color-coded borders that clearly communicate a family of related options.

3. **Figure-ground separation is insufficient in dark mode.** In light mode, white cards (`--bg-card: #ffffff`) separate cleanly from the gray page (`--bg-primary: #f8fafc`). In dark mode, cards (`#1e293b`) on background (`#0f172a`) have only a subtle difference. The `--shadow` in dark mode (`0 1px 3px rgba(0,0,0,0.3)`) is swallowed by the dark background. The `stat-card`'s 1px border (`--border-color: #475569`) does the heavy lifting for card separation in dark mode. Consider increasing shadow opacity or using a slightly lighter card background.

---

## 6. Fitts's Law & Usability Heuristics (Nielsen)

**Rating: 6/10**

### Observations

1. **The most important action (Study) is well-placed.** The Study button is full-width (`w-full`), tall (`py-4`), and positioned prominently on the home screen. It follows Fitts's Law by being large and centrally located. The grading buttons are also full-width in a 4-column grid (`grid-cols-4`), making them easy to tap. However, the "Back to Home" button on the session-complete screen is secondary-styled when it should be the primary action (when no challenge is pending), which violates the heuristic of making the most common action the easiest.

2. **Error prevention is weak.** The "Reset all data" button in settings is a destructive, irreversible action styled as a tiny `text-[10px]` text link with no confirmation dialog. One accidental tap destroys all progress. The "Back" button during card review (`setIsFlipped(false)`) does not confirm whether the user wants to flip back or return home -- it just unflips the card, which is confusing. There is no undo for placement test results after applying them.

3. **Recognition over recall is strong.** The grading buttons show interval hints ("1m", "6m", "10m", "1d", "4d") so users know the consequence of each choice. The category focus icons (Globe, Plane, Briefcase, Heart) use recognizable metaphors. The "Grading Guide" modal provides just-in-time help. The language selector shows flags alongside names. The placement test shows tier names and colors to anchor the user's position. However, keyboard shortcuts (1-4 for grading, Space to flip) are entirely hidden -- no visual hints anywhere.

---

## 7. Emotional Design (Don Norman)

**Rating: 6/10**

### Observations

1. **Visceral level (first impression) is clean but cold.** The purple accent on dark navy creates a "developer tool" aesthetic, not a warm learning companion. The atom logo reinforces "science lab" over "language journey." The Orbitron typeface for "LANGLAB" feels more like a tech startup than an educational app. First-time users see the onboarding carousel with emoji in a plain white/dark slide -- no illustration, no character, no warmth. Compare this to Duolingo's first screen which immediately introduces Duo with personality.

2. **Behavioral level (does it feel good to use?) is mixed.** The card flip mechanism is satisfying -- tap to reveal feels like turning a flashcard. The tile challenge (`WordTileChallenge`) has good tactile feedback with `active:scale-95` on tiles. The `animate-shake` on wrong answers is appropriately punishing without being harsh. However, the grading step after every card is cognitively heavy -- four buttons with abstract labels requiring the user to constantly self-assess. The audio play button's `animate-pulse` when active provides good feedback.

3. **Reflective level (does it make me feel accomplished?) is underdeveloped.** The achievements in `GamificationHub` have good concepts (icon + title + description) but no unlock animation, no celebratory moment. The streak flame (`StreakFlame.tsx`) evolves visually through tiers (small, big, blue, lightning) which is good reflective design. But there is no daily summary, no "you learned X words today" celebration, no comparative stat ("you reviewed more than yesterday"). The session-complete screen just shows a count and buttons.

---

## 8. Accessibility (WCAG 2.1)

**Rating: 4/10**

### Observations

1. **Color contrast has critical failures.** The `--text-muted` in light mode (`#94a3b8`) on `--bg-card` (`#ffffff`) yields a contrast ratio of approximately 3.0:1, which fails WCAG AA for both normal text (4.5:1) and large text (3:1 only for 18pt+). This color is used extensively for labels, timestamps, and secondary information. The `--text-faint` (`#cbd5e1` on white) fails even more severely at approximately 1.6:1. In dark mode, `--text-faint` (`#64748b`) on `--bg-card` (`#1e293b`) yields roughly 2.5:1. These are pervasive failures affecting most secondary UI text.

2. **Focus indicators are absent.** There is no `:focus-visible` styling anywhere in `index.css`. The `btn-primary` and `btn-ghost` classes have no focus ring. Custom toggle switches (for auto-play and notifications) are `<button>` elements with no focus indicator. The word tiles in `WordTileChallenge` have no focus state. Keyboard users cannot visually track where they are. The keyboard shortcut support in `StudySession` (1-4, Space) is good functionality, but the lack of visible focus makes it inaccessible to sighted keyboard users.

3. **Screen reader support is minimal.** ARIA attributes are almost entirely absent. The only `aria-label` in the entire codebase appears on the onboarding dots (`aria-label="Go to slide N"`) and the audio play button. The custom toggle switches have no `role="switch"` or `aria-checked`. The progress bars use plain `<div>` elements with no `role="progressbar"`, `aria-valuenow`, or `aria-valuemax`. The word popover portal has no `role="dialog"` or focus trapping. The tile challenge provides no screen reader guidance about the sentence-building task.

---

## 9. Game Design (Gamification Theory)

**Rating: 7/10**

### Observations

1. **The core loop is solid.** Study -> Grade -> Spaced Repetition creates a tight behavioral loop. The tile challenge interleaving breaks monotony. The variable reward schedule comes from SRS itself: easy cards disappear for days while hard cards return in minutes. The "Study More" option after session completion enables flow state continuation. The daily new card limit creates scarcity (a proven engagement driver). The checkpoint/boss challenge at new-card milestones provides a meta-loop.

2. **Boss battles are well-designed gamification.** The boss system (22 bosses with bronze/silver/gold rings, test-tube SVG artwork, health bars, timed scoring) is a strong implementation of challenge-mastery alignment. The boss names are localized per language (e.g., "Avventura" for Italian), adding flavor. The ring system provides replayability -- users can return to earn gold on a boss they only got bronze on. The "Experiments" trophy room in `GamificationHub` provides a visual progression map.

3. **Streak mechanics have good guardrails.** Streak freezes (earned every 7 days, max 3) prevent the cliff-of-despair problem where one missed day kills motivation. The visual tiering (small flame, big flame, blue flame, lightning bolt) at streak milestones creates aspiration targets. However, the streak is only incremented on session start (`updateStreak` called in `handleStartSession`), not on session completion, which means opening and immediately closing a session counts as maintaining a streak. This creates a loophole that undermines the mechanic.

---

## 10. Mobile-First Responsive Design

**Rating: 7/10**

### Observations

1. **The app is mobile-first by default.** The `max-w-md` (448px) constraint on the home view keeps it phone-sized. The `max-w-lg` (512px) for study/challenge views is appropriately wider for sentence content. The `h-dvh` usage for full-screen views handles mobile viewport correctly. The card font size scales dynamically based on word count (6 tiers from `text-2xl` to `text-base`), which is essential for sentences ranging from 3 to 15+ words across 11 languages.

2. **Tablet and desktop are ignored.** There are no breakpoints above `md` (768px). On an iPad, the 448px-wide home screen floats in the center with vast empty space on both sides. On a desktop, the experience is identical. There is no multi-column layout for wider screens, no side panel for settings, no expanded topic map. The `md:text-*` responsive variants in StudySession's font sizing are the only desktop accommodations. The settings panel in particular would benefit from a side drawer on wider screens.

3. **Thumb zones are well-considered for mobile.** The Study button at the bottom of the home screen falls in the easy-reach thumb zone. The grading buttons at the bottom of the study screen are correctly positioned for one-handed use. The "Exit" button in the top-left of study sessions is in the harder-to-reach zone, which is appropriate for a less-frequent action. However, the language dropdown in the top-right header requires two taps (open + select) in a hard-to-reach zone, which could frustrate frequent language-switchers.

---

## Synthesis

### TOP 5 Commonalities (agreed upon by most schools)

1. **Celebrations and emotional feedback are weak** (Duolingo, Emotional Design, Game Design, HIG all flag this). The app handles correctness states well but fails to create joy moments.

2. **Dark mode needs more contrast and separation** (Gestalt, Accessibility, Material Design, Scandinavian Minimalism all note the flat dark theme with insufficient figure-ground separation).

3. **Touch target sizing is inconsistent** (Material Design, Fitts's Law, HIG, Mobile-First all identify undersized secondary controls).

4. **Navigation lacks structure** (HIG, Fitts's Law, Gestalt, Mobile-First all note the flat state-machine navigation without consistent chrome).

5. **The home screen is information-dense** (Scandinavian Minimalism, Gestalt, Fitts's Law, Material Design all flag the "wall of boxes" home layout).

### 3 Biggest Strengths

1. **The SRS + gamification core loop is genuinely well-designed.** Boss battles, streak mechanics with freezes, tile challenges, and the placement test are sophisticated, well-integrated features that most language apps lack. The `challengeService` and `srsService` powering these features are robust.

2. **The typography and color restraint create a coherent visual identity.** Inter + JetBrains Mono, the disciplined use of uppercase tracking-widest labels, and the single-accent-color system make the app look professional and intentional. The CSS custom properties system in `index.css` is clean and maintainable.

3. **The WordPopover with dictionary + conjugation is a power-user delight.** Tapping any word for IPA, translation, lemma, part-of-speech, and full conjugation tables across 11 languages is a feature most competitors charge for. The portal-based positioning and overflow handling show technical care.

### 3 Biggest Weaknesses

1. **Accessibility is critically deficient.** No focus indicators, failing contrast ratios on most secondary text, no ARIA attributes, no screen reader support, no `prefers-reduced-motion` handling. This affects real users and creates legal risk.

2. **The app lacks emotional warmth and personality.** The "lab" theme is executed as "sterile" rather than "curious/playful." No mascot, minimal celebration animations, no personality in the copy ("Session Complete!" could be "Great experiment!"). The first-time experience does not create emotional investment.

3. **Responsive design stops at mobile.** The app is unusable (functionally works but wastes 70% of the viewport) on tablets and desktops. For a web app, this is a significant limitation that prevents use on the devices where sustained study is most comfortable.

---

## Specific Recommendations

### 1. Theme/Branding

The "lab" concept has unrealized potential. Currently the only lab-themed elements are the atom logo SVG and the test-tube boss SVGs. The branding sits in an uncanny valley between "serious tool" and "playful game."

**Recommendations:**
- Commit fully to the lab metaphor. Rename "Study" to "Experiment." Rename "Stats" to "Lab Journal." Call grammar nodes "Formulas." Call boss battles "Final Experiments."
- Create a mascot: a curious lab beaker character with eyes and expressions. Use it in the onboarding, on the empty state, and for celebration moments. Think "Erlenmeyer flask with goggles."
- The atom logo SVG with orbiting electrons is good -- keep it, but give it a slight glow effect matching the accent color.
- The Orbitron font for "LANGLAB" works for branding but feels isolated. Consider using it for tier headers in the topic map too.

### 2. Color

**Current palette analysis:**
- Primary: `#7c3aed` (violet-600) -- good energy, distinct from Duolingo's green
- Dark background: `#0f172a` (slate-900) -- too dark, creates cave-like feel
- Light background: `#f8fafc` (slate-50) -- good, very clean

**Recommended palette:**
```
Primary:        #7c3aed (keep -- distinctive, good contrast)
Primary light:  #a78bfa (dark mode accent -- keep)
Primary dark:   #5b21b6 (for pressed states, currently unused)
Secondary:      #06b6d4 (cyan-500 -- "science/lab" feel, complements purple)
Surface light:  #ffffff
Surface dark:   #1a1f36 (slightly warmer than current #1e293b)
Background dark:#0d1117 (GitHub-style dark, warmer than #0f172a)
Success:        #10b981 (emerald-500 -- keep)
Error:          #ef4444 (red-500 -- keep)
Warning:        #f59e0b (amber-500 -- keep)
Info:           #3b82f6 (blue-500 -- for dictionary/popover highlights)
```

**Dark mode specific:**
- Increase card background lightness: `#1e293b` -> `#1f2937` (gray-800 instead of slate-800)
- Increase shadow opacity: `rgba(0,0,0,0.3)` -> `rgba(0,0,0,0.5)`
- Add a subtle 1px inner border glow on `stat-card` in dark mode

### 3. Layout

**Dashboard (Home screen):**
The current home screen stacks 7+ elements vertically. Restructure into clear sections:

```
[Header: Logo + Language + Theme toggle]
[Hero card: Streak + Study button merged -- ONE big CTA]
[Secondary row: Stats | Map -- two small cards side by side]
[Vocab Focus: keep as-is but collapse into a single-line selector]
[Vocabulary link: keep]
[Settings: keep as expandable]
```

The key change: merge the stat-card and Study button into a single "hero" card. The streak flame sits left, the Study button sits right, and progress bar sits below. This reduces the home screen from 7 boxes to 4.

**Study session layout:**
- Move the progress bar to the very top (above everything, edge-to-edge)
- Give the new/learn/review counters a fixed position so they do not scroll
- Add a bottom safe area that is always visible for grading buttons

**Tablet/desktop (768px+):**
- Add a persistent sidebar with language selector, stats summary, and topic map
- Study session gets a wider card with more horizontal padding
- Settings become a side panel instead of collapsible section

### 4. Typography

**Current fonts:** Inter (body), JetBrains Mono (numbers), Orbitron (logo)

**Recommendations:**
- Inter is excellent -- keep it as the primary face
- JetBrains Mono for numbers/stats is a good choice -- keep it
- Orbitron for the logo is fine but overspecialized. Consider using it also for tier labels in TopicMap ("A1", "A2", "B1") to reinforce the brand
- **Critical fix:** The `text-[9px]` and `text-[8px]` sizes used for tense tabs, freeze labels, and some badges are too small for mobile reading. Minimum body text should be 11px; minimum UI label should be 10px
- Add a display weight for celebration screens: "Session Complete!" and boss victory text would benefit from a heavier or more distinctive treatment
- The typographic scale is: 8, 9, 10, 11, xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30). This is too many steps. Consolidate to: 10, 12, 14, 16, 20, 24, 32.

### 5. Micro-interactions

**What exists:**
- `animate-fade-in` (opacity + translateY 6px, 0.3s) -- used everywhere
- `animate-slide-up` (opacity + translateY 20px, 0.3s) -- grading buttons
- `animate-shake` (translateX oscillation, 0.4s) -- wrong tile answer
- `animate-pulse-glow` (box-shadow pulse, 2s infinite) -- boss button, current node
- `animate-boss-appear` (scale + translate, 0.6s) -- boss intro
- `animate-ring-reveal` (scale overshoot, 0.6s) -- ring earned
- `animate-flame` (scale Y/X flicker, 1.5s infinite) -- streak flame
- `active:scale-95` on most buttons
- `hover:translateY(-1px)` on primary buttons

**What is missing:**
- **Card flip animation.** Currently the card just shows/hides content. Add a 3D rotation: `transform: rotateY(180deg)` with `perspective(1000px)` on the card container. This is the single highest-impact animation the app could add.
- **Correct answer celebration.** On GOOD/EASY, briefly flash the card border green and scale it up 2%. On AGAIN, briefly shake and flash red.
- **Progress bar animations.** The progress fill transitions (`transition: width 0.5s ease`) are good. Add a subtle shimmer/gradient animation on the fill to make progress feel alive.
- **Confetti on milestone moments.** Session complete with 100% correct, boss defeated with gold ring, streak milestone reached -- these deserve a canvas-based confetti burst (lightweight libraries like canvas-confetti are 3KB).
- **Word popover entrance.** Currently uses `animate-fade-in`. Add a slight spring/bounce: `transform: scale(0.95)` -> `scale(1)` with a 0.2s cubic-bezier.
- **Tile snap animation.** When a tile moves from the bank to the sentence area, animate its position. Currently it just appears/disappears.

### 6. Information Architecture

**Current flow:**
```
Onboarding -> Language Selection -> HOME
HOME -> STUDY (session) -> SESSION COMPLETE -> CHALLENGE (optional) -> HOME
HOME -> TOPICS (grammar map)
HOME -> GAMIFICATION (stats/achievements)
HOME -> VOCAB (word list)
HOME -> PLACEMENT (test)
HOME -> SETTINGS (inline expandable)
```

**Issues:**
- Settings are buried inside a collapsible on the home screen. They deserve their own view with proper navigation.
- There is no way to reach Vocabulary, Topics, or Gamification from within a study session. Users must exit first.
- The Placement Test is a one-time flow that appears as a banner -- good pattern, but after dismissal there is no way to find it again except through Settings ("Reset placement test").
- The Challenge flow is only reachable after session completion. Users cannot voluntarily practice boss battles.

**Recommended IA:**
```
HOME (dashboard)
  |-- Study (session)
  |     |-- Challenge (triggered by milestones)
  |
  |-- [Bottom nav bar with 4 tabs:]
        |-- Home (dashboard)
        |-- Map (topic tree)
        |-- Vocab (word list)
        |-- Profile (stats + settings)
```

Adding a bottom tab bar would:
- Provide consistent navigation (HIG, Material Design)
- Make Vocab and Map always accessible (Fitts's Law)
- Remove the need for multiple back buttons
- Follow the pattern users expect from language apps

The tab bar should be hidden during Study and Challenge views (full-screen immersive modes), matching Duolingo's behavior.

---

## Priority Action Items

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Fix contrast ratios on `--text-muted` and `--text-faint` | Accessibility/Legal | Low |
| P0 | Add `:focus-visible` outline styles globally | Accessibility | Low |
| P0 | Add ARIA roles to progress bars, toggles, popover | Accessibility | Medium |
| P1 | Add card flip animation (3D rotate) | Emotional/UX | Medium |
| P1 | Add bottom tab bar navigation | IA/Usability | Medium |
| P1 | Improve dark mode card-background contrast | Visual | Low |
| P1 | Add confetti on milestone celebrations | Emotional | Low |
| P2 | Create a mascot character | Branding | High |
| P2 | Add responsive layouts for tablet/desktop | Reach | High |
| P2 | Add confirmation dialog for "Reset all data" | Error prevention | Low |
| P2 | Add `prefers-reduced-motion` media query | Accessibility | Low |
| P3 | Consolidate home screen layout (hero card) | Visual | Medium |
| P3 | Introduce secondary color (cyan) for variety | Visual | Low |
| P3 | Add keyboard shortcut hints in study UI | Discoverability | Low |

---

## Recommended Contrast-Fixed Values

```css
/* Light mode -- WCAG AA compliant */
--text-muted:    #64748b;  /* was #94a3b8 -- bumped from 3.0:1 to 4.6:1 on white */
--text-faint:    #94a3b8;  /* was #cbd5e1 -- bumped from 1.6:1 to 3.0:1 (large text only) */
--text-secondary: #475569; /* was #64748b -- bumped to 7.0:1 */

/* Dark mode -- WCAG AA compliant */
--text-muted:    #94a3b8;  /* unchanged -- 4.6:1 on #1e293b is passing */
--text-faint:    #64748b;  /* unchanged -- but should only be used for decorative elements */
```

Note: current `--text-muted` in light mode and `--text-secondary` in light mode are swapped compared to their actual contrast ratios. The naming suggests muted < secondary, but the hex values deliver the opposite contrast hierarchy. The current light mode `--text-muted: #94a3b8` is actually less readable than `--text-secondary: #64748b`.
