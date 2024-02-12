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
  <v-container>
    <v-row>
      <v-col>
        <v-card class="mx-auto" max-width="220">
          <v-list
            v-if="(rooms?.length ?? 0) > 0"
            :items="
              rooms?.map((room) => ({
                title: room.name,
                value: room.id,
                props: {
                  appendIcon:
                    room.users.length > 0
                      ? `mdi-numeric-${room.users.length}-circle`
                      : undefined,
                },
              }))
            "
            @click:select="
              ({ id: roomId }) => {
                router.push({
                  name: 'roomId',
                  params: {
                    roomId: roomId as string,
                  },
                });
              }
            "
          ></v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-btn color="amber-lighten-1" @click="createRoom">Create Room</v-btn>
    </v-row>
  </v-container>
</template>
