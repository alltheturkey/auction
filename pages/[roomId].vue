<script lang="ts" setup>
import type { Room } from '@/types';

const runtimeConfig = useRuntimeConfig();
const roomId = useRoute('roomId').params.roomId;
const ws = new WebSocket(new URL(roomId, runtimeConfig.public.ws).href);
const myUserId = ref('');
const roomName = ref('');
const room: Ref<Room | undefined> = ref();

const beforeunloadHandler = (e: BeforeUnloadEvent) => {
  if (
    room.value?.turnUser &&
    room.value?.users.some(({ id }) => id === myUserId.value)
  ) {
    e.preventDefault();
    // eslint-disable-next-line no-param-reassign
    e.returnValue = '';
  }
};

const unloadHandler = () => {
  if (myUserId.value) {
    // ユーザ削除(ルーム退出)
    navigator.sendBeacon(`/api/users/${myUserId.value}`);
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
  if (myUserId.value) {
    // ゲーム開始後はリレーションが存在するので失敗する(同じタブなら再接続できる)
    navigator.sendBeacon(`/api/users/${myUserId.value}`);
  }
});

onBeforeRouteLeave(() => {
  if (
    room.value?.turnUser &&
    room.value?.users.some(({ id }) => id === myUserId.value)
  ) {
    const answer = confirm('Do you want to leave?');

    if (!answer) {
      return false;
    }
  }
});

// ルーム参加処理
void useFetch(`/api/rooms/${roomId}`).then(async ({ data: room, status }) => {
  roomName.value = room.value?.name ?? '';
  const sessionUserId = sessionStorage.getItem('userId');

  if (status.value === 'error' || room.value?.turnUserId !== null) {
    // 開始済みゲームに参加していたユーザがリロードしたときに再接続
    if (
      sessionUserId !== null &&
      (room.value?.users.some(({ id }) => id === sessionUserId) ?? false)
    ) {
      myUserId.value = sessionUserId;

      return;
    } else {
      sessionStorage.clear();
      await navigateTo('/');

      return;
    }
  }

  let userName = localStorage.getItem('userName');

  while (userName === null) {
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
      myUserId.value = user.value.id;
      sessionStorage.setItem('userId', myUserId.value);
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

watch(
  () => room.value?.auction?.amount,
  () => {
    if (
      room.value?.auction?.amount !== undefined &&
      room.value.auction.amount >= bidAmount.value
    ) {
      bidAmount.value = room.value.auction.amount + 10;
    }
  },
);

const bid = async () => {
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'PUT',
    body: {
      topUserId: myUserId.value,
      amount: bidAmount.value,
    },
  });
};

const isMoneyClickable = computed(() => {
  if (room.value?.auction?.buyerUser?.id === myUserId.value) {
    return true;
  }

  return false;
});

const buyAuction = () => {
  // buyerが自分でauction確定
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'DELETE',
    body: {
      buyerUserId: myUserId.value,
      moneyUserCardIds: [],
    },
  });
};

const sellAuction = () => {
  // buyerがtopUserでauction確定
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'DELETE',
    body: {
      buyerUserId: room.value?.auction?.topUser?.id,
      moneyUserCardIds: [],
    },
  });
};

const payAuction = async (moneyUserCardIds: number[]) => {
  // auction終了
  const { status } = await useFetch(
    `/api/auctions/${room.value?.auction?.id}`,
    {
      method: 'DELETE',
      body: {
        buyerUserId: myUserId.value,
        moneyUserCardIds,
      },
    },
  );

  // 支払いに失敗した場合は、オークションやり直し
  if (status.value === 'error') {
    await useFetch(`/api/auctions/${room.value?.auction?.id}`, {
      method: 'PUT',
      body: {
        amount: 0,
      },
    });
  }
};

const startTrade = () => {};
</script>

<template>
  <div>
    <h1>{{ roomName }}</h1>
    <v-btn
      v-if="room?.turnUser === null && room?.users.length >= 2"
      @click="startGame()"
    >
      Start
    </v-btn>

    <div>
      <div v-if="room?.auction">
        <span>
          {{ room.auction.topUser?.name }}
          {{ room.auction.amount }}
        </span>
        <span v-if="room.auction.buyerUser === null">
          <div v-if="room.turnUser?.id !== myUserId">
            <div :style="{ width: '100px' }">
              <v-text-field
                append-inner-icon="mdi-arrow-up-bold-circle-outline"
                :min="room.auction.amount + 10"
                :model-value="bidAmount"
                step="10"
                type="number"
                variant="outlined"
                @click:append-inner="bid()"
                @update:model-value="(e) => (bidAmount = Number(e))"
              />
            </div>
          </div>
          <div
            v-if="
              room.turnUser?.id === myUserId &&
              room.auction === null &&
              room.trade === null
            "
          >
            <v-btn @click="buyAuction()">buy</v-btn>
            <v-btn @click="sellAuction()">sell</v-btn>
          </div>
        </span>
      </div>
      <img
        class="card"
        :src="room?.auction?.animalCard.img ?? '/img/back.avif'"
      />

      <span
        v-if="
          room?.turnUser?.id === myUserId &&
          room?.auction === null &&
          room?.trade === null
        "
      >
        <!-- [] auction/tradeが可能か判定(v-if) -->
        <!-- [] ゲーム終了ではない && auction/tradeできない場合ターンのスキップ処理が必要 -->
        <v-btn @click="startAuction()">auction</v-btn>
        <v-btn @click="startTrade()">trade</v-btn>
      </span>
    </div>

    <section>
      <MoleculesUser
        v-for="user of room?.users"
        :key="user.id"
        :turn-user-id="room?.turnUser?.id"
        :user="user"
      />
    </section>

    <section>
      <AtomsMoneyCards
        :is-money-clickable="isMoneyClickable"
        :user-cards="
          room?.users.find(({ id }) => id === myUserId)?.userCards ?? []
        "
        @submit="(moneyUserCardIds) => payAuction(moneyUserCardIds)"
      />
    </section>
  </div>
</template>

<style scoped>
.card {
  width: 75px;
}
</style>
