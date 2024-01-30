<script setup lang="ts">
const router = useRouter();
const { data: rooms, refresh } = await useFetch('/api/rooms');

const timer = setInterval(() => {
  void refresh();
}, 1000);

onUnmounted(() => {
  clearInterval(timer);
});

const createRoom = async () => {
  const { data: room } = await useFetch('/api/rooms', {
    method: 'POST',
  });

  if (room.value !== null) {
    await router.push({
      name: 'roomId',
      params: {
        roomId: room.value.id,
      },
    });
  }
};
</script>

<template>
  <div>
    <ul>
      <li v-for="room of rooms" :key="room.id">
        <NuxtLink
          :to="{
            name: 'roomId',
            params: {
              roomId: room.id,
            },
          }"
          >{{ `${room.name}(${room.users.length})` }}</NuxtLink
        >
      </li>
    </ul>
    <button @click="createRoom">Create Room</button>
  </div>
</template>
