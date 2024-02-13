<script lang="ts" setup>
import type { User } from '@/types';

const props = defineProps<{
  user: User;
  isAnimalCardClickable: boolean;
}>();

const animalUserCards = computed(() =>
  props.user.userCards
    .filter(({ card }) => card.type === 'ANIMAL')
    .toSorted((a, b) => a.card.point - b.card.point),
);

const tradeAnimalUserCardIds = useTradeAnimalUserCardIds();

const clickAnimalCard = (animalCardId: number) => {
  if (!props.isAnimalCardClickable) return;

  if (tradeAnimalUserCardIds.value[props.user.id]?.includes(animalCardId)) {
    tradeAnimalUserCardIds.value[props.user.id] = tradeAnimalUserCardIds.value[
      props.user.id
    ].filter((id) => id !== animalCardId);
  } else {
    tradeAnimalUserCardIds.value[props.user.id] = [
      ...(tradeAnimalUserCardIds.value[props.user.id] ?? []),
      animalCardId,
    ];
  }
};
</script>

<template>
  <img
    v-for="animalUserCard in animalUserCards"
    :key="animalUserCard.id"
    class="card"
    :class="{
      clickable: isAnimalCardClickable,
      clicked: tradeAnimalUserCardIds[user.id]?.includes(animalUserCard.id),
    }"
    :src="animalUserCard.card.img"
    @click="clickAnimalCard(animalUserCard.id)"
  />
</template>

<style scoped>
.card {
  margin: 3px;
  width: 75px;
  border: 5px solid white;
  border-radius: 10px;
  box-shadow:
    0px 3px 1px -2px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)),
    0px 2px 2px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)),
    0px 1px 5px 0px var(--v-shadow-key-ambient-opacity, rgba(0, 0, 0, 0.12));
}

.clickable {
  cursor: pointer;
  border: 5px dashed rgb(65, 65, 65);
}

.clicked {
  border: 5px solid rgb(135, 100, 252);
}
</style>
