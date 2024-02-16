<script lang="ts" setup>
import type { User, UserCard } from '@/types';

const props = defineProps<{
  user: User & { userCards: UserCard[] };
  isAnimalCardClickable: boolean;
  isMe: boolean;
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

const newUserCardIds = useNewUserCardIds();

// 4枚揃った動物カード
const completedAnimalUserCardIds = computed(() => {
  const animalCardPointSet = new Set(
    props.user.userCards
      .filter(({ card }) => card.type === 'ANIMAL')
      .map(({ card: { point } }) => point),
  );

  return [...animalCardPointSet]
    .map(
      (point) =>
        [
          point,
          props.user.userCards
            .filter(({ card }) => card.type === 'ANIMAL')
            .filter(({ card }) => card.point === point),
        ] as const,
    )
    .filter(([, userCards]) => userCards.length === 4)
    .flatMap(([, userCards]) => userCards.map(({ id }) => id));
});
</script>

<template>
  <div
    v-auto-animate
    class="animal-card-container"
    :class="{ 'my-card-container': isMe }"
  >
    <img
      v-for="animalUserCard in animalUserCards"
      :key="animalUserCard.id"
      class="card"
      :class="{
        'new-card': newUserCardIds[user.id]?.includes(animalUserCard.id),
        clickable:
          isAnimalCardClickable &&
          !completedAnimalUserCardIds.includes(animalUserCard.id),
        clicked: tradeAnimalUserCardIds[user.id]?.includes(animalUserCard.id),
      }"
      :src="animalUserCard.card.img"
      @click="
        if (
          isAnimalCardClickable &&
          !completedAnimalUserCardIds.includes(animalUserCard.id)
        ) {
          clickAnimalCard(animalUserCard.id);
        }
      "
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

.my-card-container {
  background: repeating-linear-gradient(
    -45deg,
    rgb(220, 220, 220),
    rgb(220, 220, 220) 125px,
    rgb(246, 246, 246) 125px,
    rgb(246, 246, 246) 250px
  );
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

.new-card {
  border: 5px solid #ffab00;
}

.clickable {
  cursor: pointer;
  border: 5px dashed rgb(125, 125, 125);
}

.clicked {
  border: 5px solid #7c4dff;
}
</style>
