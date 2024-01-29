<script lang="ts" setup>
import type { Room } from '@/types';

const runtimeConfig = useRuntimeConfig();
const roomId = useRoute('roomId').params.roomId;
const ws = new WebSocket(new URL(roomId, runtimeConfig.public.ws).href);
const userId = ref('');
const roomName = ref('');
const room: Ref<Room | undefined> = ref();

const beforeunloadHandler = (e: BeforeUnloadEvent) => {
  if (
    room.value?.turnUser &&
    room.value?.users.some(({ id }) => id === userId.value)
  ) {
    e.preventDefault();
    // eslint-disable-next-line no-param-reassign
    e.returnValue = '';
  }
};

const unloadHandler = () => {
  if (userId.value) {
    // ユーザ削除(ルーム退出)
    navigator.sendBeacon(`/api/users/${userId.value}`);
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
  if (userId.value) {
    // ゲーム開始後はリレーションが存在するので失敗する(同じタブなら再接続できる)
    navigator.sendBeacon(`/api/users/${userId.value}`);
  }
});

onBeforeRouteLeave(() => {
  if (
    room.value?.turnUser &&
    room.value?.users.some(({ id }) => id === userId.value)
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
      userId.value = sessionUserId;

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
      userId.value = user.value.id;
      sessionStorage.setItem('userId', userId.value);
    }
  });
});

const startGame = () => {
  void useFetch(`/api/rooms/${roomId}`, {
    method: 'PUT',
  });
};

const startAuction = () => {
  void useFetch(`/api/auctions`, {
    method: 'POST',
    body: {
      roomId,
    },
  });
};

const bidAmount = ref(10);

const bid = () => {
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'PUT',
    body: {
      topUserId: userId.value,
      amount: bidAmount.value,
    },
  });
};

const buyAuction = () => {
  // buyerが自分でauction確定
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'DELETE',
    body: {
      buyerUserId: userId.value,
      moneyUserCardIds: [],
    },
  });
};

const isMoneyClickable = computed(() => {
  if (room.value?.auction?.buyerUser?.id === userId.value) {
    return true;
  }

  return false;
});

const sellAuction = () => {
  // buyerがtopUserでauction確定
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'DELETE',
    body: {
      // [] openapi修正
      buyerUserId: room.value?.auction?.topUser?.id,
      moneyUserCardIds: [],
    },
  });
};

const payAuction = async () => {
  // auction終了
  const { status } = await useFetch(
    `/api/auctions/${room.value?.auction?.id}`,
    {
      method: 'DELETE',
      body: {
        buyerUserId: userId.value,
        moneyUserCardIds: clickedMoneyCardIds.value,
      },
    },
  );
  clickedMoneyCardIds.value = [];

  // 支払いに失敗した場合は、オークションやり直し
  if (status.value === 'error') {
    await useFetch(`/api/auctions/${room.value?.auction?.id}`, {
      method: 'PUT',
      body: {
        topUserId: userId.value,
        amount: 0,
      },
    });
  }
};

const clickedMoneyCardIds = ref<number[]>([]);

const clickMoneyCard = (userCardId: number) => {
  if (!isMoneyClickable.value) return;

  if (clickedMoneyCardIds.value.includes(userCardId)) {
    clickedMoneyCardIds.value = clickedMoneyCardIds.value.filter(
      (id) => id !== userCardId,
    );
  } else {
    clickedMoneyCardIds.value = [...clickedMoneyCardIds.value, userCardId];
  }
};
</script>

<template>
  <div>
    <h1>{{ roomName }}</h1>
    <button
      v-if="room?.turnUser === null && room?.users.length >= 2"
      @click="startGame()"
    >
      Start
    </button>

    <div>
      <div v-if="room?.auction">
        <span>
          {{ room.auction.topUser?.name }}
          {{ room.auction.amount }}
        </span>
        <span v-if="room.auction.buyerUser === null">
          <div v-if="room.turnUser?.id !== userId">
            <input
              v-model="bidAmount"
              type="number"
              :min="room.auction.amount + 10"
              step="10"
            />
            <button @click="bid()">bid</button>
          </div>
          <div v-if="room.turnUser?.id === userId && room.auction.amount > 0">
            <button @click="buyAuction()">buy</button>
            <button @click="sellAuction()">sell</button>
          </div>
        </span>
      </div>
      <img
        class="card"
        :src="room?.auction?.animalCard.img ?? '/img/back.avif'"
      />

      <span
        v-if="
          room?.turnUser?.id === userId &&
          room?.auction === null &&
          room?.trade === null
        "
      >
        <button @click="startAuction()">auction</button>
        <button>trade</button>
      </span>
    </div>

    <div v-for="user in room?.users" :key="user.id">
      <div
        :style="{ color: user.id === room?.turnUser?.id ? 'green' : 'black' }"
      >
        {{ user.name }}
      </div>
      <div>
        Money:
        {{
          user.userCards.filter(({ card: { type } }) => type === 'MONEY').length
        }}
      </div>
      <AnimalCards :user-cards="user.userCards" />
    </div>

    <img
      v-for="moneyCard in room?.users
        .find(({ id }) => id === userId)
        ?.userCards.filter(({ card: { type } }) => type === 'MONEY')
        .toSorted((a, b) => a.card.point - b.card.point)"
      :key="moneyCard.id"
      :style="{
        border: isMoneyClickable
          ? clickedMoneyCardIds.includes(moneyCard.id)
            ? '1px solid red'
            : '1px dotted black'
          : '1px',
      }"
      class="card"
      :src="moneyCard.card.img"
      @click="clickMoneyCard(moneyCard.id)"
    />

    <button
      v-if="isMoneyClickable && clickedMoneyCardIds.length > 0"
      @click="payAuction()"
    >
      submit
    </button>
  </div>
</template>

<style scoped>
.card {
  width: 75px;
}
</style>
