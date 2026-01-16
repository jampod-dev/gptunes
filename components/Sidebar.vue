<template>
    <!-- prettier-ignore -->
    <nav class="sidebar" aria-label="Main navigation">
        <ul>
            <li>
                <NuxtLink to="/" aria-label="Create playlist" :aria-current="route.name === 'index' ? 'page' : undefined">
                    <img v-if="route.name == 'index'" src="~/public/img/chat-fill.svg" alt="" aria-hidden="true" />
                    <img v-else src="~/public/img/chat-line.svg" alt="" aria-hidden="true" />
                </NuxtLink>
            </li>

        </ul>
        <div class="logout" v-if="loggedIn">
            <a href="#" @click.prevent="logout()" aria-label="Log out of your account">
                <img src="~/public/img/logout.svg" alt="" aria-hidden="true" />
            </a>
        </div>
    </nav>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
const { loggedIn, clear } = useUserSession();

const router = useRouter();
const route = useRoute();

async function logout() {
    if (await confirmation('Are you sure you want to log out?')) {
        clear();
    }
}
</script>

<style lang="scss" scoped>
.sidebar {
    margin: 0 auto;
    background: rgba(20, 20, 30, 0.9);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
}
ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    img {
        width: 32px;
        height: 32px;
    }
}
.logout {
    img {
        width: 32px;
        height: 32px;
    }
}
</style>
