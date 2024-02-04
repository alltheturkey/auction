<script lang="ts" setup>
import type { User } from '@/types';

defineProps<{
  user: User;
  turnUserId?: string;
  isAnimalCardClickable: boolean;
}>();
</script>

<template>
  <div>
    <div
      :class="{
        'turn-user-name': user.id === turnUserId,
      }"
    >
      {{ user.name }}
    </div>
    <div>
      Money:
      {{
        user.userCards.filter(({ card: { type } }) => type === 'MONEY').length
      }}
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
