<template>
    <!-- prettier-ignore -->
    <div class="loader-container">
        <div class="ai-brain-loader">
            <div class="brain-core"></div>
            <div class="brain-ring"></div>
            <div class="brain-ring"></div>
        </div>
    </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.loader-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 20px;

    @media screen and (max-width: 767px) {
        padding: 15px;
    }
}

.ai-brain-loader {
    width: 60px;
    height: 60px;
    position: relative;

    @media screen and (max-width: 767px) {
        width: 40px;
        height: 40px;
    }
}

.brain-core {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    position: relative;
    animation: pulse-core 2s ease-in-out infinite;
}

.brain-ring {
    position: absolute;
    border: 2px solid transparent;
    border-top: 2px solid rgba(102, 126, 234, 0.6);
    border-right: 2px solid rgba(102, 126, 234, 0.3);
    border-radius: 50%;
    animation: spin 2s linear infinite;

    @media screen and (max-width: 767px) {
        border-width: 1.5px;
    }
}

.brain-ring:nth-child(2) {
    width: 80px;
    height: 80px;
    top: -10px;
    left: -10px;
    animation-duration: 3s;
    animation-direction: reverse;

    @media screen and (max-width: 767px) {
        width: 53px;
        height: 53px;
        top: -7px;
        left: -7px;
    }
}

.brain-ring:nth-child(3) {
    width: 100px;
    height: 100px;
    top: -20px;
    left: -20px;
    border-top-color: rgba(118, 75, 162, 0.4);
    border-right-color: rgba(118, 75, 162, 0.2);
    animation-duration: 4s;

    @media screen and (max-width: 767px) {
        width: 67px;
        height: 67px;
        top: -13px;
        left: -13px;
    }
}

@keyframes pulse-core {
    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
    }
    50% {
        transform: scale(1.1);
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.6);
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
