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

// bid額入力欄を自動更新
watch(
  () => room.value?.auction?.amount,
  () => {
    if (room.value?.auction?.amount !== undefined) {
      if (room.value.auction.amount === 0) {
        bidAmount.value = 10;
      }

      if (room.value.auction.amount >= bidAmount.value) {
        bidAmount.value = room.value.auction.amount + 10;
      }
    }
  },
);

const bid = () => {
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'PUT',
    body: {
      topUserId: myUserId.value,
      amount: bidAmount.value,
    },
  });
};

const isMoneyCardClickable = computed(() => {
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

const isAuctionable = computed(() => {
  // 全ユーザの動物カードの枚数を計算
  const userCardCounts =
    room.value?.users
      .map(
        ({ userCards }) =>
          userCards.filter(({ card: { type } }) => type === 'ANIMAL').length,
      )
      .reduce((acc, cur) => acc + cur, 0) ?? 0;

  if (userCardCounts >= 36) {
    return false;
  }

  return true;
});

const isTradable = computed(() => {
  const myAnimalCardPoints =
    room.value?.users
      .find(({ id }) => id === myUserId.value)
      ?.userCards.filter(({ card: { type } }) => type === 'ANIMAL')
      .map(({ card: { point } }) => point) ?? [];

  const othersAnimalCardPoints =
    room.value?.users
      .filter(({ id }) => id !== myUserId.value)
      .flatMap(({ userCards }) =>
        userCards.filter(({ card: { type } }) => type === 'ANIMAL'),
      )
      .map(({ card: { point } }) => point) ?? [];

  if (
    myAnimalCardPoints.some((cardId) => othersAnimalCardPoints.includes(cardId))
  ) {
    return true;
  }

  return false;
});

const isAnimalCardClickable = ref(false);
const tradeAnimalUserCardIds = useTradeAnimalUserCardIds();
const isSelectedTradeAnimalCardsSubmittable = ref(false);

// 選択したトレード対象動物カードの枚数チェック
watch(
  () => tradeAnimalUserCardIds.value,
  () => {
    const tradeAnimalUserCardIdsLength = Object.values(
      tradeAnimalUserCardIds.value,
    ).flat().length;
    const myTradeAnimaluserCardIdsLength =
      tradeAnimalUserCardIds.value[myUserId.value]?.length ?? 0;

    if (
      myTradeAnimaluserCardIdsLength > 0 &&
      tradeAnimalUserCardIdsLength === myTradeAnimaluserCardIdsLength * 2
    ) {
      isSelectedTradeAnimalCardsSubmittable.value = true;

      return;
    }

    isSelectedTradeAnimalCardsSubmittable.value = false;
  },
  {
    deep: true,
  },
);

const startTrade = () => {
  tradeAnimalUserCardIds.value = {};
  isAnimalCardClickable.value = false;
  // [] POST /trade
  // [] if status == error 選択やり直し  isAnimalCardClickable.value  = true
};
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
            v-if="room.turnUser?.id === myUserId && room.auction?.amount > 0"
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

      <v-btn v-if="isSelectedTradeAnimalCardsSubmittable" @click="startTrade()"
        >submit</v-btn
      >

      <span
        v-if="
          room?.turnUser?.id === myUserId &&
          room?.auction === null &&
          room?.trade === null &&
          isAnimalCardClickable === false
        "
      >
        <v-btn v-if="isAuctionable" @click="startAuction()">auction</v-btn>
        <v-btn v-if="isTradable" @click="isAnimalCardClickable = true"
          >trade</v-btn
        >
        <!-- [] ゲーム終了ではない && auction/tradeできない場合ターンのスキップ処理が必要 -->
        <v-btn>skip</v-btn>
      </span>
    </div>

    <section>
      <MoleculesUser
        v-for="user of room?.users"
        :key="user.id"
        :is-animal-card-clickable="isAnimalCardClickable"
        :turn-user-id="room?.turnUser?.id"
        :user="user"
      />
    </section>

    <section>
      <AtomsMoneyCards
        :is-money-card-clickable="isMoneyCardClickable"
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
