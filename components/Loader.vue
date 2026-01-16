<template>
    <div class="loading">
        <div class="vinyl-spinner"></div>
        <div class="sound-wave">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
        </div>
    </div>
</template>

<script lang="ts" setup></script>
<style lang="scss" scoped>
.loading {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
/* Vinyl Record Spinner */
.vinyl-spinner {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(45deg, #1a1a1a 0%, #333 100%);
    position: relative;
    animation: spin 3s linear infinite;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

.vinyl-spinner::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: #4a4a5b;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.vinyl-spinner::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80px;
    height: 80px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
}

/* Sound Wave Bars */
.sound-wave {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 50px;
    margin-top: -20px;
    position: relative;
    z-index: 1;
}

.wave-bar {
    width: 6px;
    background: linear-gradient(to top, #4a4a5b, #6a5acd);
    border-radius: 3px;
    animation: wave 1.5s ease-in-out infinite;
}

.wave-bar:nth-child(1) {
    animation-delay: 0s;
}
.wave-bar:nth-child(2) {
    animation-delay: 0.1s;
}
.wave-bar:nth-child(3) {
    animation-delay: 0.2s;
}
.wave-bar:nth-child(4) {
    animation-delay: 0.3s;
}
.wave-bar:nth-child(5) {
    animation-delay: 0.4s;
}
.wave-bar:nth-child(6) {
    animation-delay: 0.5s;
}
.wave-bar:nth-child(7) {
    animation-delay: 0.4s;
}
.wave-bar:nth-child(8) {
    animation-delay: 0.3s;
}
.wave-bar:nth-child(9) {
    animation-delay: 0.2s;
}
.wave-bar:nth-child(10) {
    animation-delay: 0.1s;
}

/* Loading Text */
.loading-text {
    color: white;
    font-size: 1.2rem;
    font-weight: 300;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.9;
    animation: pulse 2s ease-in-out infinite;
}
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes wave {
    0%,
    100% {
        height: 10px;
    }
    50% {
        height: 50px;
    }
}

@keyframes pulse {
    0%,
    100% {
        opacity: 0.9;
    }
    50% {
        opacity: 0.5;
    }
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0px) scale(1);
        opacity: 0.3;
    }
    50% {
        transform: translateY(-20px) scale(1.1);
        opacity: 0.7;
    }
}

@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
@media (max-width: 768px) {
    .vinyl-spinner {
        width: 100px;
        height: 100px;
    }
}
</style>
