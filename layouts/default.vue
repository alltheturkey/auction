<template>
  <v-app
    :style="{
      backgroundColor: '#e1e1e1',
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
  font-family: 'Chakra Petch', 'Noto Color Emoji', monospace;
}

.v-input__control {
  .v-field {
    background-color: white;
  }

  + .v-input__details {
    display: none;
  }
}

.v-badge__badge {
  font-size: 1.1rem !important;
}
</style>
