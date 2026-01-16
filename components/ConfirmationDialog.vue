<template>
    <div>
        <div class="modal" @click="closeDialog(false)">
            <div class="card">
                <h3>{{ props.header }}</h3>
                <div class="buttons">
                    <button label="Cancel" color="gray" variant="solid" @click="closeDialog(false)">
                        Cancel
                    </button>
                    <button @click="closeDialog">Delete</button>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { closeDialog } from 'vue3-promise-dialog';
import { onMounted } from 'vue';

interface Props {
    header?: string;
    text?: string;
}

const props = defineProps<Props>();
const isOpen = ref(true);
defineExpose({
    returnValue: () => {
        return true;
    },
});
</script>

<style lang="scss" scoped>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
}
</style>
