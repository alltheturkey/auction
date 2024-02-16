<script lang="ts" setup>
const props = defineProps<{
  value: number;
}>();

const number = ref(props.value);
let timerId: NodeJS.Timeout | undefined;

watch(
  () => props.value,
  (newValue, oldValue) => {
    if (timerId) {
      clearInterval(timerId);
    }

    if (newValue > oldValue) {
      timerId = setInterval(() => {
        if (number.value < newValue) {
          number.value += 1;
        } else {
          if (timerId) {
            clearInterval(timerId);
          }
        }
      }, 20);
    } else {
      number.value = newValue;
    }
  },
);
</script>

<template>
  <span
    :style="{
      display: 'inline-block',
      textAlign: 'left',
      width: 14.5 * number.toString().length + 'px',
    }"
    >{{ number }}</span
  >
</template>
