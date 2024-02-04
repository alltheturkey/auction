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
  <div>
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

    <v-btn
      v-if="isMoneyCardClickable && clickedMoneyUserCardIds.length > 0"
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
