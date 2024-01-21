<script lang="ts" setup>
const route = useRoute('roomId');
const roomId = route.params.roomId;
</script>

<template>
  <h1>Room {{ roomId }}</h1>
</template>
