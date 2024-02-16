<script lang="ts" setup>
import type { Room, User, UserCard } from '@/types';

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
  // console.log(JSON.parse(event.data));
  room.value = JSON.parse(event.data) as Room;
};

onMounted(() => {
  window.addEventListener('beforeunload', beforeunloadHandler);
  window.addEventListener('unload', unloadHandler);
  ws.addEventListener('message', onMessageHandler);
});

onUnmounted(() => {
  if (buySellableTimer.value !== null) {
    clearTimeout(buySellableTimer.value);
  }

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

const bidAuction = () => {
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'PUT',
    body: {
      topUserId: myUserId.value,
      amount: bidAmount.value,
    },
  });
};

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

  isMoneyCardClickable.value = false;
};

const deckAnimalCardsLen = computed(() => {
  // 全ユーザの動物カードの枚数を計算
  const userCardCounts =
    room.value?.users
      .map(
        ({ userCards }) =>
          userCards.filter(({ card: { type } }) => type === 'ANIMAL').length,
      )
      .reduce((acc, cur) => acc + cur, 0) ?? 0;

  return 40 - userCardCounts;
});

const isAuctionable = computed(() => {
  if (deckAnimalCardsLen.value <= 0) {
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

// 選択したトレード対象動物カードの枚数チェック -> トレード確定ボタンの表示切替
watch(
  () => tradeAnimalUserCardIds.value,
  () => {
    if (room.value?.trade == null) {
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
    }

    isSelectedTradeAnimalCardsSubmittable.value = false;
  },
  {
    deep: true,
  },
);

const startTrade = async () => {
  const targetUserId = Object.keys(tradeAnimalUserCardIds.value).find(
    (userId) => userId !== myUserId.value,
  );

  if (targetUserId === undefined) {
    return;
  }

  const { status } = await useFetch(`/api/trades`, {
    method: 'POST',
    body: {
      roomId,
      targetUserId,
      targetUserAnimalUserCardIds: tradeAnimalUserCardIds.value[targetUserId],
      turnUserAnimalUserCardIds: tradeAnimalUserCardIds.value[myUserId.value],
    },
  });

  if (status.value === 'success') {
    isAnimalCardClickable.value = false;
  } else if (status.value === 'error') {
    tradeAnimalUserCardIds.value = {};
  }
};

const isMoneyCardClickable = ref(false);
const newUserCardIds = useNewUserCardIds();
const buySellableTimer = ref<NodeJS.Timeout | null>(null);
const isBuySellable = ref(false);

watch(room, (newRoom, oldRoom) => {
  // タイマーリセット
  if (buySellableTimer.value !== null) {
    clearTimeout(buySellableTimer.value);
  }

  // BUY SELLクリッカブル制御(遅延)
  isBuySellable.value = false;
  buySellableTimer.value = setTimeout(() => (isBuySellable.value = true), 5000);

  // auction買い取りの場合、お金カードをクリック可能にする
  if (room.value?.auction?.buyerUser?.id === myUserId.value) {
    isMoneyCardClickable.value = true;
  }

  // トレード対象の動物カードを表示
  if (room.value?.trade && room.value.turnUser) {
    tradeAnimalUserCardIds.value = {
      [room.value.turnUser.id]: room.value.trade.turnUserAnimalUserCardIds,
      [room.value.trade.targetUser.id]:
        room.value.trade.targetUserAnimalUserCardIds,
    };

    // トレードに参加している場合お金カードをクリック可能にする
    if (
      (room.value.trade.targetUser.id === myUserId.value ||
        room.value.turnUser?.id === myUserId.value) &&
      room.value.trade.confirmedUserId !== myUserId.value
    ) {
      isMoneyCardClickable.value = true;
    }
  } else {
    tradeAnimalUserCardIds.value = {};
  }

  // 差分から新規UserCardを取得
  for (const user of newRoom?.users ?? []) {
    newUserCardIds.value[user.id] = user.userCards.map(({ id }) => id);
    const oldUser = oldRoom?.users.find(({ id }) => id === user.id);

    if (oldUser) {
      newUserCardIds.value[user.id] = user.userCards
        .filter(
          ({ id }) => !oldUser.userCards.some(({ id: oldId }) => oldId === id),
        )
        .map(({ id }) => id);
    } else {
      newUserCardIds.value = {};
    }
  }
});

const bidTrade = (moneyUserCardIds: number[]) => {
  void useFetch(`/api/trades/${room.value?.trade?.id}`, {
    method: 'PUT',
    body: {
      userId: myUserId.value,
      moneyUserCardIds,
    },
  });
};

const payTrade = async () => {
  const { status } = await useFetch(`/api/trades/${room.value?.trade?.id}`, {
    method: 'DELETE',
    body: {
      userId: myUserId.value,
    },
  });

  if (status.value === 'success') {
    isMoneyCardClickable.value = false;
  }
};

const isGameEnd = computed(() => {
  if (isAuctionable.value === false) {
    return (
      room.value?.users.every((user) => {
        const animalUserCards = user.userCards.filter(
          ({ card: { type } }) => type === 'ANIMAL',
        );

        const kindsOfAnimal = new Set(
          animalUserCards.map(({ card: { point } }) => point),
        ).size;

        return kindsOfAnimal * 4 === animalUserCards.length;
      }) ?? false
    );
  }

  return false;
});

const skipTurn = () => {
  void useFetch(`/api/next-turn/${roomId}`);
};

const badgeContent = computed(() => {
  if (isGameEnd.value) {
    // 勝者表示
    return '🏆';
  }

  if (room.value?.auction) {
    if (room.value.auction?.buyerUser) {
      return `💸${room.value.auction.buyerUser.name}`;
    } else {
      if (room.value.auction.topUser) {
        return `👑${room.value.auction.topUser.name}`;
      } else {
        return 'Auction';
      }
    }
  }

  if (room.value?.trade) {
    const turnUserTradeBetLength = room.value.trade.tradeBet.filter(
      ({ userId }) => userId === room.value?.turnUser?.id,
    ).length;
    const targetUserTradeBetLength = room.value.trade.tradeBet.filter(
      ({ userId }) => userId === room.value?.trade?.targetUser.id,
    ).length;

    return `${room.value?.turnUser?.name}(${turnUserTradeBetLength})⚔️${room.value.trade.targetUser.name}(${targetUserTradeBetLength})`;
  }

  if (room.value?.turnUser) {
    return `🙍${room.value?.turnUser?.name}`;
  }

  return '';
});

// トレード確定時のお金カードのidを取得(submitすると何を選択したかわからなくなるため)
const confirmedTradeBetUserCardIds = computed(() => {
  if (room.value?.trade?.confirmedUserId === myUserId.value) {
    return room.value.trade.tradeBet
      .filter(({ userId }) => userId === myUserId.value)
      .map(({ moneyUserCard }) => moneyUserCard.id);
  }

  return [];
});

const sortedUsers = computed(() => {
  if ((room.value?.userOrder ?? []).length > 0) {
    return (
      room.value?.userOrder.map(
        (userId) =>
          room.value?.users.find(({ id }) => id === userId) as User & {
            userCards: UserCard[];
          },
      ) ?? []
    );
  }

  return room.value?.users ?? [];
});
</script>

<template>
  <div>
    <h2 class="room-name">{{ roomName }}</h2>

    <section
      v-auto-animate
      :style="{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        margin: '5px 0',
      }"
    >
      <div>
        <v-badge :content="badgeContent" location="bottom">
          <img
            class="card"
            :src="room?.auction?.animalCard.img ?? '/img/back.avif'"
          />
        </v-badge>
        <div
          v-if="room?.auction?.animalCard.img === undefined"
          :style="{
            position: 'absolute',
            top: '0',
            width: '100px',
            height: '138.91px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
        >
          <span
            :style="{
              fontSize: '2rem',
              width: '100%',
              height: '50px',
              textAlign: 'center',
              lineHeight: '50px',
              backgroundColor: 'rgba(240, 240, 240, 0.5)',
              backdropFilter: 'blur(12px)',
              fontWeight: 'bold',
            }"
          >
            {{ deckAnimalCardsLen }}
          </span>
        </div>
      </div>

      <div v-if="room?.auction">
        <div
          :style="{
            fontSize: '1.5rem',
            textAlign: 'center',
          }"
        >
          <div
            :style="{
              fontWeight: 'bold',
              backgroundColor: 'white',
              borderRadius: '10px',
              paddingRight: '5px',
              minWidth: '120.8px',
              textAlign: 'center',
            }"
          >
            <span>💰</span>
            <AtomsAnimatedNumber :value="room.auction.amount" />
            <!-- {{ `💰${room.auction.amount}` }} -->
          </div>
        </div>

        <span v-if="room.auction.buyerUser === null">
          <v-text-field
            v-if="room.turnUser?.id !== myUserId"
            append-inner-icon="mdi-arrow-up-bold-circle-outline"
            :min="room.auction.amount + 10"
            :model-value="bidAmount"
            step="10"
            :style="{ width: '120.8px', marginTop: '15px' }"
            type="number"
            variant="outlined"
            @click:append-inner="bidAuction()"
            @update:model-value="(e) => (bidAmount = Number(e))"
          />

          <div
            v-if="room.turnUser?.id === myUserId && room.auction?.amount > 0"
          >
            <v-btn
              block
              color="red-accent-2"
              :disabled="!isBuySellable"
              :style="{ margin: '10px 0' }"
              @click="buyAuction()"
              >buy</v-btn
            >
            <v-btn
              block
              color="blue-accent-2"
              :disabled="!isBuySellable"
              :style="{ margin: '10px 0' }"
              @click="sellAuction()"
              >sell</v-btn
            >
          </div>
        </span>
      </div>

      <v-btn
        v-if="isSelectedTradeAnimalCardsSubmittable"
        color="deep-purple-accent-2"
        @click="startTrade()"
        >submit</v-btn
      >
      <v-btn
        v-if="room?.turnUser === null && room?.users.length >= 2"
        color="amber-lighten-1"
        prepend-icon="mdi-play"
        @click="startGame()"
      >
        Start
      </v-btn>
      <v-btn v-if="isGameEnd" @click="startGame()">restart</v-btn>

      <span
        v-if="
          room?.turnUser?.id === myUserId &&
          room?.auction === null &&
          room?.trade === null &&
          isAnimalCardClickable === false &&
          isGameEnd === false
        "
      >
        <v-btn
          v-if="isAuctionable"
          block
          color="brown"
          prepend-icon="mdi-gavel"
          :style="{ margin: '10px 0' }"
          @click="startAuction()"
          >auction</v-btn
        >
        <v-btn
          v-if="isTradable"
          block
          color="teal-lighten-1"
          prepend-icon="mdi-swap-horizontal-bold"
          :style="{ margin: '10px 0' }"
          @click="isAnimalCardClickable = true"
          >trade</v-btn
        >
        <v-btn
          v-if="isAuctionable === false && isTradable === false"
          block
          color="deep-orange-lighten-1"
          prepend-icon="mdi-skip-next"
          @click="skipTurn()"
          >skip</v-btn
        >
      </span>
    </section>

    <section v-auto-animate>
      <MoleculesUser
        v-for="user in sortedUsers"
        :key="user.id"
        :buyer-user="room?.auction?.buyerUser ?? undefined"
        :is-animal-card-clickable="isAnimalCardClickable"
        :is-game-end="isGameEnd"
        :my-user-id="myUserId"
        :target-user="room?.trade?.targetUser ?? undefined"
        :top-user="room?.auction?.topUser ?? undefined"
        :turn-user-id="room?.turnUser?.id"
        :user="user"
      />
    </section>

    <section>
      <AtomsMoneyCards
        :confirmed-trade-bet-user-card-ids="confirmedTradeBetUserCardIds"
        :is-money-card-clickable="isMoneyCardClickable"
        :user="room?.users.find(({ id }) => id === myUserId)"
        @change="
          (moneyUserCardIds) => {
            if (isMoneyCardClickable === false) return;
            if (room?.trade != null) {
              bidTrade(moneyUserCardIds);
            }
          }
        "
        @submit="
          (moneyUserCardIds) => {
            if (room?.auction != null) {
              payAuction(moneyUserCardIds);
            }
            if (room?.trade != null) {
              payTrade();
            }
          }
        "
      />
    </section>
  </div>
</template>

<style scoped>
.card {
  width: 100px;
  border-radius: 10px;
  border: 4px solid white;
  box-shadow:
    0px 3px 1px -2px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)),
    0px 2px 2px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)),
    0px 1px 5px 0px var(--v-shadow-key-ambient-opacity, rgba(0, 0, 0, 0.12));
}

.room-name {
  color: rgb(162, 162, 162);
  margin: 0 10px;
  view-transition-name: room-name;
}
</style>
