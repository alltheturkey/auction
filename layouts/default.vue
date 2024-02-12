<template>
  <v-app
    :style="{
      background: '#e1e1e1',
    }"
  >
    <slot />
  </v-app>
</template>

<script setup lang="ts">
useHead({
  title: 'auction',
  meta: [
    {
      name: 'robots',
      content: 'noindex nofollow',
    },
  ],
});
</script>

<style>
html {
  font-family: 'Chakra Petch', monospace;
}
</style>
