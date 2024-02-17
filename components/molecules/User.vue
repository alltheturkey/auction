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
  myUserId: string | null;
  score: number;
  isWinner: boolean;
}>();

const userName = computed(() => {
  if (props.isGameEnd) {
    return `${props.isWinner ? '🏆' : ''}${props.user.name} (${props.score})`;
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
      :is-me="user.id === myUserId"
      :user="user"
    />
  </v-badge>
</template>
