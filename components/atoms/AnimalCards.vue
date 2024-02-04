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
    v-for="animalUserCard of animalUserCards"
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
  width: 75px;
  border: 5px solid transparent;
}

.clickable {
  cursor: pointer;
  border: 5px dotted black;
}

.clicked {
  border: 5px solid red;
}
</style>
