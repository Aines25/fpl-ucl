<script setup lang="ts">
import { fixtures, knockoutTies } from '../../data'

const { snapshot } = useCompetition()
const { resultById } = useFixtures()
const { drawn } = useKnockout()
</script>

<template>
  <div>
    <SectionHeading kicker="Knockout stage" title="Bracket" />
    <p v-if="!drawn" class="mb-6 max-w-2xl font-sans text-sm leading-6 text-silver">
      The Round of 16 is drawn once the group stage is complete. Draws are run offline with
      <code class="text-white">npm run draw:knockout</code> and committed into
      <code class="text-white">data/knockout.ts</code> so a refresh can never change the bracket.
    </p>
    <KnockoutBracket
      :ties="knockoutTies"
      :results="snapshot?.knockout ?? []"
      :fixtures="fixtures"
      :fixture-results="resultById"
    />
  </div>
</template>
