<template>
  <v-app>
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
