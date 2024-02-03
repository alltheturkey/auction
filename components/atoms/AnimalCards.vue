<script lang="ts" setup>
import type { UserCard } from '@/types';

const props = defineProps<{
  userCards: UserCard[];
}>();

const animalUserCards = computed(() =>
  props.userCards
    .filter(({ card }) => card.type === 'ANIMAL')
    .toSorted((a, b) => a.card.point - b.card.point),
);
</script>

<template>
  <img
    v-for="animalUserCard of animalUserCards"
    :key="animalUserCard.id"
    class="card"
    :src="animalUserCard.card.img"
  />
</template>

<style scoped>
.card {
  width: 75px;
}
</style>
