<script lang="ts" setup>
import type { User, UserCard } from '@/types';

const props = defineProps<{
  user: User & { userCards: UserCard[] };
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
  <div v-auto-animate class="animal-card-container">
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
  </div>
</template>

<style scoped>
.animal-card-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  background: rgb(246, 246, 246);
  padding: 5px 0 15px 0;
  min-height: 136.47px;
  box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  margin: 0 10px;
  width: 100%;
}

.card {
  margin: 3px;
  width: 80px;
  border: 5px solid white;
  border-radius: 10px;
  box-shadow:
    0px 3px 1px -2px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)),
    0px 2px 2px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)),
    0px 1px 5px 0px var(--v-shadow-key-ambient-opacity, rgba(0, 0, 0, 0.12));
}

.clickable {
  cursor: pointer;
  border: 5px dashed rgb(125, 125, 125);
}

.clicked {
  border: 5px solid #7c4dff;
}
</style>
