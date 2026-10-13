<script setup lang="ts">
import { fixtures, knockoutTies } from '../../data'

const { snapshot } = useCompetition()
const { resultById } = useFixtures()
</script>

<template>
  <div>
    <SectionHeading kicker="Knockout stage" title="Knockout" />
    <KnockoutBracket
      :ties="knockoutTies"
      :results="snapshot?.knockout ?? []"
      :fixtures="fixtures"
      :fixture-results="resultById"
    />
  </div>
</template>
