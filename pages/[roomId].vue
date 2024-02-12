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

const bidAuction = () => {
  void useFetch(`/api/auctions/${room.value?.auction?.id}`, {
    method: 'PUT',
    body: {
      topUserId: myUserId.value,
      amount: bidAmount.value,
    },
  });
};

const isMoneyCardClickable = ref(false);

watch(
  () => room.value?.auction,
  () => {
    if (room.value?.auction?.buyerUser?.id === myUserId.value) {
      isMoneyCardClickable.value = true;
    }
  },
);

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

watch(
  () => room.value?.trade,
  () => {
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
  },
);

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
    return `${room.value?.turnUser?.name}🆚${room.value.trade.targetUser.name}`;
  }

  if (room.value?.turnUser) {
    return `🙍${room.value?.turnUser?.name}`;
  }

  return '';
});
</script>

<template>
  <div>
    <h1 :style="{ margin: '0 10px' }">{{ roomName }}</h1>

    <section
      :style="{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '10px',
      }"
    >
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
          height: '142.292px',
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
    </section>

    <section
      :style="{
        display: 'flex',
        justifyContent: 'center',
        margin: '15px',
        minHeight: '36px',
        maxHeight: '75px',
      }"
    >
      <div v-if="room?.auction">
        <div
          :style="{
            fontSize: '1.5rem',
            textAlign: 'center',
            marginBottom: '2px',
          }"
        >
          <span>
            {{ `💰${room.auction.amount}` }}
          </span>
        </div>

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
                @click:append-inner="bidAuction()"
                @update:model-value="(e) => (bidAmount = Number(e))"
              />
            </div>
          </div>
          <div
            v-if="room.turnUser?.id === myUserId && room.auction?.amount > 0"
          >
            <v-btn
              color="red-accent-2"
              :style="{ margin: '0 5px' }"
              @click="buyAuction()"
              >buy</v-btn
            >
            <v-btn
              color="blue-accent-2"
              :style="{ margin: '0 5px' }"
              @click="sellAuction()"
              >sell</v-btn
            >
          </div>
        </span>
      </div>

      <v-btn v-if="isSelectedTradeAnimalCardsSubmittable" @click="startTrade()"
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
          color="brown"
          prepend-icon="mdi-gavel"
          :style="{ margin: '0 5px' }"
          @click="startAuction()"
          >auction</v-btn
        >
        <v-btn
          v-if="isTradable"
          color="teal-lighten-1"
          prepend-icon="mdi-swap-horizontal-bold"
          :style="{ margin: '0 5px' }"
          @click="isAnimalCardClickable = true"
          >trade</v-btn
        >
        <v-btn
          v-if="isAuctionable === false && isTradable === false"
          @click="skipTurn()"
          >skip</v-btn
        >
      </span>
    </section>

    <section>
      <MoleculesUser
        v-for="user of room?.users"
        :key="user.id"
        :is-animal-card-clickable="isAnimalCardClickable"
        :is-game-end="isGameEnd"
        :trade-bid-length="
          room?.trade?.tradeBet.filter(({ userId }) => userId === user.id)
            ?.length
        "
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
</style>
