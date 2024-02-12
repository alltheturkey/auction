<script lang="ts" setup>
import type { User } from '@/types';

const props = defineProps<{
  user: User;
  turnUserId?: string;
  isAnimalCardClickable: boolean;
  isGameEnd: boolean;
}>();

const score = computed(() => {
  const animalCardsByPoint = new Map(
    props.user.userCards
      .filter(({ card: { type } }) => type === 'ANIMAL')
      .map((obj) => [obj.card.point, obj.card]),
  );

  return (
    animalCardsByPoint.size *
    [...animalCardsByPoint.keys()].reduce((a, b) => a + b, 0)
  );
});
</script>

<template>
  <div>
    <div>
      <span
        :class="{
          'turn-user-name': user.id === turnUserId,
        }"
      >
        {{ user.name }}
      </span>
      <span v-if="isGameEnd"> ({{ score }})</span>
    </div>

    <AtomsAnimalCards
      :is-animal-card-clickable="isAnimalCardClickable"
      :user="user"
    />
  </div>
</template>

<style>
.turn-user-name {
  color: green;
}
</style>
