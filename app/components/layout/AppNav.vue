<script setup lang="ts">
import { BookOpen, CalendarDays, GitFork, LayoutDashboard, Table2, Trophy } from '@lucide/vue'

const route = useRoute()

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/groups', label: 'Groups', icon: Table2 },
  { to: '/league', label: 'League', icon: Trophy },
  { to: '/fixtures', label: 'Fixtures', icon: CalendarDays },
  { to: '/knockout', label: 'Knockout', icon: GitFork },
  { to: '/rules', label: 'Rules', icon: BookOpen },
]

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-20 border-t border-cyan/20 bg-navy-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:static md:border-t-0 md:border-b md:pb-0"
    aria-label="Competition"
  >
    <ul class="mx-auto flex max-w-page items-stretch justify-around px-1 md:justify-start md:gap-1 md:px-6">
      <li v-for="link in links" :key="link.to" class="flex-1 md:flex-none">
        <NuxtLink
          :to="link.to"
          :class="[
            'flex flex-col items-center gap-1 px-1.5 py-2.5 font-stats text-[10px] tracking-kicker uppercase transition-colors sm:text-kicker md:flex-row md:gap-2 md:px-3 md:py-3 md:text-label',
            isActive(link.to) ? 'text-cyan' : 'text-silver hover:text-white',
          ]"
        >
          <component :is="link.icon" class="size-4" />
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
