<script lang="ts" setup>
import type { User } from '@/types';

defineProps<{
  user: User;
  turnUserId?: string;
  isAnimalCardClickable: boolean;
  tradeBidLength?: number;
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
    <div v-if="tradeBidLength">Trade bid length: {{ tradeBidLength }}</div>

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
