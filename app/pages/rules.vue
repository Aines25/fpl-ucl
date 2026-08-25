<script setup lang="ts">
import { matchdays } from '../../data/matchdays'
</script>

<template>
  <div class="max-w-3xl space-y-8 text-silver">
    <SectionHeading kicker="How it works" title="Rules" />

    <section class="space-y-3">
      <h3 class="font-display text-white uppercase tracking-display">Group stage</h3>
      <p>
        Eight groups of four. Each team plays each other twice across six FPL Gameweeks.
        A higher Gameweek net score wins the fixture: 3 points for a win, 1 for a draw, 0 for a loss.
        Tables use FPL points for (PF), points against (PA) and difference, not football goals.
      </p>
    </section>

    <section class="space-y-3">
      <h3 class="font-display text-white uppercase tracking-display">FPL scoring</h3>
      <p>
        Official Fantasy Premier League Gameweek scores are the source of truth. Transfer hits are taken from FPL and subtracted from the Gameweek points total.
      </p>
      <p>
        Chips count as they do in FPL except two house rules: Bench Boost does not add substitute points to the fixture total (only the starting 11 count), and Triple Captain is scored as a normal 2x captain. Free Hit still uses the Free Hit XI. Team pages still show when a chip is active and the points each player scored.
      </p>
    </section>

    <section class="space-y-3">
      <h3 class="font-display text-white uppercase tracking-display">Fixture status</h3>
      <p>
        <strong class="text-live">Live</strong> while the Gameweek is in progress.
        <strong class="text-provisional">Provisional</strong> after FPL marks the Gameweek finished
        but before data is fully checked (bonus, autosubs, corrections).
        <strong class="text-final">Confirmed</strong> only when FPL reports the Gameweek as data-checked.
        Live scores can still change the table; they are not official until Confirmed.
      </p>
    </section>

    <section class="space-y-3">
      <h3 class="font-display text-white uppercase tracking-display">Group tie-breakers</h3>
      <ol class="list-decimal space-y-1 pl-5">
        <li>Competition points</li>
        <li>Head-to-head points among the tied managers</li>
        <li>Head-to-head PF difference among the tied managers</li>
        <li>Overall PF difference</li>
        <li>Overall PF</li>
        <li>Alphabetical name</li>
      </ol>
    </section>

    <section class="space-y-3">
      <h3 class="font-display text-white uppercase tracking-display">Knockout</h3>
      <p>
        Group winners and runners-up qualify. Round of 16 is a constrained draw: winners versus
        runners-up, no pairing from the same original group. Quarter-finals and semi-finals are
        open draws.
      </p>
      <p>
        Round of 16, quarter-finals and semi-finals are two FPL Gameweeks, decided on aggregate.
        There is no away-goals rule. The final is a single Gameweek.
      </p>
    </section>

    <section class="space-y-3">
      <h3 class="font-display text-white uppercase tracking-display">Knockout tie-breakers</h3>
      <p>If a tie is level on aggregate, official FPL cup-style rules apply:</p>
      <ol class="list-decimal space-y-1 pl-5">
        <li>Most goals scored by the manager’s FPL team across the tie (when available)</li>
        <li>Fewest goals conceded across the tie (when available)</li>
        <li>Highest single-leg FPL score</li>
      </ol>
    </section>

    <section class="space-y-3">
      <h3 class="font-display text-white uppercase tracking-display">Gameweek mapping</h3>
      <div class="overflow-hidden rounded-md border border-cyan/20">
        <table class="w-full font-stats text-label">
          <thead class="bg-navy-800 text-cyan">
            <tr>
              <th class="px-3 py-2 text-left">Round</th>
              <th class="px-3 py-2 text-left">FPL GW</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in matchdays" :key="entry.matchday" class="border-t border-cyan/10">
              <td class="px-3 py-2 text-white">{{ entry.label }}</td>
              <td class="px-3 py-2">{{ entry.fplGameweek }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
