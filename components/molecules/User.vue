<script lang="ts" setup>
import type { User, UserCard } from '@/types';

const props = defineProps<{
  user: User & { userCards: UserCard[] };
  turnUserId?: string;
  isAnimalCardClickable: boolean;
  isGameEnd: boolean;
  topUser?: User;
  buyerUser?: User;
  targetUser?: User;
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

const userName = computed(() => {
  if (props.isGameEnd) {
    return `${props.user.name} (${score.value})`;
  }

  switch (props.user.id) {
    case props.targetUser?.id: {
      return `⚔️${props.user.name}`;
    }
    case props.buyerUser?.id: {
      return `💸${props.user.name}`;
    }
    case props.topUser?.id: {
      return `👑${props.user.name}`;
    }
    case props.turnUserId: {
      return `🙍${props.user.name}`;
    }
    default: {
      return props.user.name;
    }
  }
});
</script>

<template>
  <v-badge
    :content="userName"
    location="bottom"
    :style="{ width: '100%', margin: '10px 0' }"
  >
    <AtomsAnimalCards
      :is-animal-card-clickable="isAnimalCardClickable"
      :user="user"
    />
  </v-badge>
</template>

<style>
.user-name-container {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  color: rgb(82, 82, 82);
}
</style>
