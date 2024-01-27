<script lang="ts" setup>
import type { Room } from '@/types';

const runtimeConfig = useRuntimeConfig();
const roomId = useRoute('roomId').params.roomId;
const ws = new WebSocket(new URL(roomId, runtimeConfig.public.ws).href);
let userId: string | undefined;
const roomName = ref('');
const room: Ref<Room | undefined> = ref();

const beforeunloadHandler = (e: BeforeUnloadEvent) => {
  if (
    room.value?.turnUser &&
    room.value?.users.some(({ id }) => id === userId)
  ) {
    e.preventDefault();
    // eslint-disable-next-line no-param-reassign
    e.returnValue = '';
  }
};

const unloadHandler = () => {
  if (userId) {
    // ユーザ削除(ルーム退出)
    navigator.sendBeacon(`/api/users/${userId}`);
  }
};

const onMessageHandler = (event: MessageEvent<string>) => {
  console.log(JSON.parse(event.data));
  room.value = JSON.parse(event.data) as Room;
};

onMounted(() => {
  window.addEventListener('beforeunload', beforeunloadHandler);
  window.addEventListener('unload', unloadHandler);
  ws.addEventListener('message', onMessageHandler);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeunloadHandler);
  window.removeEventListener('unload', unloadHandler);
  ws.removeEventListener('message', onMessageHandler);
  ws.close();

  // ユーザ削除(ルーム退出)
  if (userId) {
    // ゲーム開始後はリレーションが存在するので失敗する(同じタブなら再接続できる)
    navigator.sendBeacon(`/api/users/${userId}`);
  }
});

onBeforeRouteLeave(() => {
  if (
    room.value?.turnUser &&
    room.value?.users.some(({ id }) => id === userId)
  ) {
    const answer = confirm('Do you want to leave?');

    if (!answer) {
      return false;
    }
  }
});

void useFetch(`/api/rooms/${roomId}`).then(async ({ data: room, status }) => {
  roomName.value = room.value?.name ?? '';
  const sessionUserId = sessionStorage.getItem('userId');

  if (status.value === 'error' || room.value?.turnUserId !== null) {
    // 開始済みゲームに参加していたユーザがリロードしたときに再接続
    if (
      sessionUserId &&
      room.value?.users.some(({ id }) => id === sessionUserId)
    ) {
      userId = sessionUserId;

      return;
    } else {
      sessionStorage.clear();
      await navigateTo('/');

      return;
    }
  }

  let userName = localStorage.getItem('userName');

  while (!userName) {
    userName = prompt('name?');
  }

  localStorage.setItem('userName', userName);

  // ユーザ作成(ルーム参加)
  void useFetch('/api/users', {
    method: 'POST',
    body: {
      name: userName,
      roomId,
    },
  }).then(({ data: user }) => {
    if (user.value) {
      userId = user.value.id;
      sessionStorage.setItem('userId', userId);
    }
  });
});

const startGame = () => {
  void useFetch(`/api/rooms/${roomId}`, {
    method: 'PUT',
  });
};
</script>

<template>
  <div>
    <h1>{{ roomName }}</h1>

    <div v-for="user in room?.users" :key="user.id">
      <div>{{ user.name }}</div>
      <!-- moneyCard -->
      <img
        v-for="moneyCard in user.userCards
          .filter(({ card: { type } }) => type === 'MONEY')
          .sort((a, b) => a.card.point - b.card.point)"
        :key="moneyCard.id"
        class="card"
        :src="moneyCard.card.img"
      />
    </div>

    <button
      v-if="room?.turnUser === null && room?.users.length >= 2"
      @click="startGame()"
    >
      Start
    </button>
  </div>
</template>

<style scoped>
.card {
  width: 100px;
}
</style>
