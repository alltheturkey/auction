<script lang="ts" setup>
import type { UserCard } from '@/types';

const props = defineProps<{
  userCards: UserCard[];
  isMoneyClickable: boolean;
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
  if (!props.isMoneyClickable) return;

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
  <div>
    <img
      v-for="moneyUserCard of MoneyUserCards"
      :key="moneyUserCard.id"
      class="card"
      :src="moneyUserCard.card.img"
      :class="{
        clickable: props.isMoneyClickable,
        clicked: clickedMoneyUserCardIds.includes(moneyUserCard.id),
      }"
      @click="
        () => {
          clickMoneyCard(moneyUserCard.id);
          emit('change', clickedMoneyUserCardIds);
        }
      "
    />

    <v-btn
      v-if="isMoneyClickable && clickedMoneyUserCardIds.length > 0"
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
  width: 75px;
}

.clickable {
  cursor: pointer;
  border: 1px dotted black;
}

.clicked {
  border: 1px solid red;
}
</style>
