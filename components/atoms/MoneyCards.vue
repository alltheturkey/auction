<script lang="ts" setup>
import type { UserCard } from '@/types';

const props = defineProps<{
  userCards: UserCard[];
  isMoneyCardClickable: boolean;
}>();

const emit = defineEmits<{
  change: [moneyUserCardIds: number[]];
  submit: [moneyUserCardIds: number[]];
}>();

const MoneyUserCards = computed(() =>
  props.userCards
    .filter(({ card }) => card.type === 'MONEY')
    .toSorted((a, b) => a.card.point - b.card.point),
);

const clickedMoneyUserCardIds = ref<number[]>([]);

const clickMoneyCard = (userCardId: number) => {
  if (!props.isMoneyCardClickable) return;

  if (clickedMoneyUserCardIds.value.includes(userCardId)) {
    clickedMoneyUserCardIds.value = clickedMoneyUserCardIds.value.filter(
      (id) => id !== userCardId,
    );
  } else {
    clickedMoneyUserCardIds.value = [
      ...clickedMoneyUserCardIds.value,
      userCardId,
    ];
  }
};
</script>

<template>
  <div class="money-card-container">
    <img
      v-for="moneyUserCard of MoneyUserCards"
      :key="moneyUserCard.id"
      class="card"
      :class="{
        clickable: isMoneyCardClickable,
        clicked: clickedMoneyUserCardIds.includes(moneyUserCard.id),
      }"
      :src="moneyUserCard.card.img"
      @click="
        () => {
          clickMoneyCard(moneyUserCard.id);
          emit('change', clickedMoneyUserCardIds);
        }
      "
    />
  </div>
  <div :style="{ width: '100%', display: 'flex', justifyContent: 'center' }">
    <v-btn
      v-if="isMoneyCardClickable && clickedMoneyUserCardIds.length > 0"
      color="pink-lighten-2"
      @click="
        () => {
          emit('submit', clickedMoneyUserCardIds);
          clickedMoneyUserCardIds = [];
        }
      "
    >
      submit
    </v-btn>
  </div>
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
  border: 5px solid #f06292;
}
</style>
