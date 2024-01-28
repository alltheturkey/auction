<script lang="ts" setup>
import type { UserCard } from '@/types';

const props = defineProps<{
  userCards: UserCard[];
}>();

const animalCards = computed(() =>
  props.userCards
    .filter(({ card }) => card.type === 'ANIMAL')
    .toSorted((a, b) => a.card.point - b.card.point),
);
</script>

<template>
  <div>
    <img
      v-for="animalCard in animalCards"
      :key="animalCard.id"
      class="card"
      :src="animalCard.card.img"
    />
  </div>
</template>

<style scoped>
.card {
  width: 75px;
}
</style>
