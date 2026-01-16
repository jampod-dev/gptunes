<template>
    <div class="layout">
        <div class="sidebar">
            <sidebar />
        </div>
        <main>
            <header>
                <div class="logo-primary">
                    <div class="logo-text">GPTunes</div>
                    <div class="sound-wave">
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                    </div>
                </div>
                <div class="header-controls">
                    <div class="music-source-selector">
                        <label for="music-source">Music Source:</label>
                        <select id="music-source" :value="selectedMusicSource" @change="handleMusicSourceChange">
                            <option value="youtube">YouTube</option>
                            <option value="spotify">Spotify</option>
                        </select>
                    </div>
                </div>
            </header>
            <NuxtPage />
        </main>
    </div>
    
    <!-- Confirm Dialog for Music Source Change -->
    <div class="confirm-dialog-wrapper">    
        <dialog ref="confirmDialog" class="confirm-dialog">
            <div class="dialog-content">
                <h3>Switch Music Source?</h3>
                <p>Switching music source will reload the page and clear your current playlist.</p>
                <div class="dialog-actions">
                    <button class="cancel-btn" @click="cancelSourceChange">Cancel</button>
                    <button class="confirm-btn" @click="confirmSourceChange">Continue</button>
                </div>
            </div>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Sidebar from '~/components/Sidebar.vue';

const MUSIC_SOURCE_KEY = 'gptunes-music-source';

const selectedModel = useState('selectedModel', () => 'gemini-3-flash-preview');
const selectedMusicSource = useState('selectedMusicSource', () => 'youtube');

const confirmDialog = ref<HTMLDialogElement | null>(null);
let pendingSourceChange: { newValue: string; selectElement: HTMLSelectElement } | null = null;

// Load persisted music source from localStorage on mount
onMounted(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(MUSIC_SOURCE_KEY);
        if (saved && (saved === 'youtube' || saved === 'spotify')) {
            selectedMusicSource.value = saved;
        }
    }
});

function handleMusicSourceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value;
    const oldValue = selectedMusicSource.value;
    
    if (newValue !== oldValue) {
        // Store pending change and revert select temporarily
        pendingSourceChange = { newValue, selectElement: target };
        target.value = oldValue;
        
        // Show the dialog
        confirmDialog.value?.showModal();
    }
}

function confirmSourceChange() {
    if (pendingSourceChange) {
        const newSource = pendingSourceChange.newValue;
        selectedMusicSource.value = newSource;
        
        // Persist to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(MUSIC_SOURCE_KEY, newSource);
        }
        
        confirmDialog.value?.close();
        pendingSourceChange = null;
        // Reload the page to start fresh
        window.location.reload();
    }
}

function cancelSourceChange() {
    pendingSourceChange = null;
    confirmDialog.value?.close();
}

await useHead({
    title: 'GPTunes - Create Playlists with AI',
    meta: [
        {
            name: 'description',
            content: 'Create music playlists by describing them to GPTunes.',
        },
    ],
    script: [
        {
            src: 'https://open.spotify.com/embed/iframe-api/v1',
            async: true,
        },
    ],
});
</script>

<style lang="css">
:root {
    /*--body-bg:#0b0a0d;*/
    --body-bg: #1d2030;
    /*--text-white: #fcfaff;*/
    --text-white: #c6c6ca;
    --text-gray: #d2ced9;
}
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
#__nuxt {
    height: 100%;
}
.text-center {
    text-align: center;
}
body {
    font-family: 'Geist', serif;
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
    color: #e4e4e7;
    height: 100vh;
    overflow: hidden;
    font-size: 16px;
    height: 100dvh;
    width: 100%;
    @media screen and (max-width: 767px) {
        font-size: 18px;
    }
}

.well {
    background: rgba(15, 15, 25, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px;
    align-items: center;
}
button,
.button {
    text-decoration: none;
    font-family: 'Geist', serif;
    padding: 10px 20px;
    white-space: nowrap;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    border: none;
    color: white;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;

    &:hover {
        /*transform: scale(1.05);*/
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    img {
        width: 20px;
        height: 20px;
        margin-right: 8px;
    }
    @media screen and (max-width: 767px) {
        font-size: 18px;
    }
}
textarea {
    font-size: 16px;
    font-family: 'Geist', serif;
    resize: none;
    width: 100%;
    padding: 10px;
    background: #1e1c21;
    color: var(--text-white);
    border-radius: 4px;
    flex: 1;
    resize: none;
    min-height: 20px;
    line-height: 1.5;
}
textarea,
select,
input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    outline: none;
    color: #f4f4f5;
    &:focus {
        outline: 1px solid rgba(255, 255, 255, 0.2);
    }
    @media screen and (max-width: 767px) {
        font-size: 18px;
    }
}

select {
    padding: 9px;
    border-radius: 4px;
}
select,
button {
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

option {
    background: rgba(15, 15, 25, 0.95);
}

.sidebar {
    @media screen and (max-width: 900px) {
        display: none;
    }
}

/* GPTunes Custom iziToast Styles */
/* Matches the dark AI chat interface theme with glassmorphism effects */

/* Base Toast Styles */
.iziToast {
    background: rgba(15, 15, 25, 0.95) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.7) !important;
    border-radius: 16px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
    font-family: inherit;
    min-height: auto !important;
    padding: 16px 20px !important;
    max-width: 400px !important;
    min-width: 320px !important;
    background: rgba(40, 40, 50, 0.1) !important;
}

/* Remove default backgrounds */
.iziToast > .iziToast-body .iziToast-texts .iziToast-title,
.iziToast > .iziToast-body .iziToast-texts .iziToast-message {
    background: transparent !important;
}

/* Success Toast */
.iziToast.iziToast-theme-success {
    /*background: rgba(16, 185, 129, 0.05) !important;*/
    border: 1px solid #10b981 !important;
}

.iziToast.iziToast-theme-success .iziToast-icon {
    background: rgba(16, 185, 129, 0.2) !important;
    color: #10b981 !important;
    border-radius: 50% !important;
    width: 24px !important;
    height: 24px !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.iziToast.iziToast-theme-success .iziToast-progressbar > div {
    background: linear-gradient(90deg, #10b981, #059669) !important;
}

/* Error Toast */
.iziToast.iziToast-theme-error {
    /*background: rgba(239, 68, 68, 0.05) !important;*/
    border: 1px solid #ef4444 !important;
}

.iziToast.iziToast-theme-error .iziToast-icon {
    background: rgba(239, 68, 68, 0.2) !important;
    color: #ef4444 !important;
    border-radius: 50% !important;
    width: 24px !important;
    height: 24px !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.iziToast.iziToast-theme-error .iziToast-progressbar > div {
    background: linear-gradient(90deg, #ef4444, #dc2626) !important;
}

/* Warning Toast */
.iziToast.iziToast-theme-warning {
    /*background: rgba(245, 158, 11, 0.05) !important;*/
    border: 1px solid #f59e0b !important;
}

.iziToast.iziToast-theme-warning .iziToast-icon {
    background: rgba(245, 158, 11, 0.2) !important;
    color: #f59e0b !important;
    border-radius: 50% !important;
    width: 24px !important;
    height: 24px !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.iziToast.iziToast-theme-warning .iziToast-progressbar > div {
    background: linear-gradient(90deg, #f59e0b, #d97706) !important;
}

/* Info Toast */
.iziToast.iziToast-theme-info {
    background: rgba(59, 130, 246, 0.05) !important;
    border: 1px solid #3b82f6 !important;
}

.iziToast.iziToast-theme-info .iziToast-icon {
    background: rgba(59, 130, 246, 0.2) !important;
    color: #3b82f6 !important;
    border-radius: 50% !important;
    width: 24px !important;
    height: 24px !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}
.iziToast .iziToast-progressbar {
    display: none !important;
}
.iziToast.iziToast-theme-info .iziToast-progressbar > div {
    background: linear-gradient(90deg, #3b82f6, #2563eb) !important;
}

/* Typography */
.iziToast .iziToast-title {
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #f4f4f5 !important;
    line-height: 1.4 !important;
    margin-bottom: 4px !important;
}

.iziToast .iziToast-message {
    font-size: 13px !important;
    color: #a1a1aa !important;
    line-height: 1.4 !important;
}

/* Close Button */
.iziToast .iziToast-close {
    background: none !important;
    color: #71717a !important;
    opacity: 1 !important;
    width: 20px !important;
    height: 20px !important;
    border-radius: 4px !important;
    transition: all 0.2s ease !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.iziToast .iziToast-close:hover {
    color: #a1a1aa !important;
    background: rgba(255, 255, 255, 0.05) !important;
}

/* Progress Bar */
.iziToast .iziToast-progressbar {
    background: rgba(255, 255, 255, 0.1) !important;
    height: 2px !important;
    border-radius: 0 0 16px 16px !important;
}

.iziToast .iziToast-progressbar > div {
    height: 100% !important;
    border-radius: 0 0 16px 16px !important;
}

/* Toast Body Layout */
.iziToast .iziToast-body {
    padding: 0 !important;
    margin: 0 !important;
    display: inline-flex;
    justify-content: center;
}

.iziToast .iziToast-body .iziToast-texts {
    margin: 0 !important;
    padding: 0 !important;
    flex: 1 !important;
    min-width: 0 !important;
    display: inline-flex !important;
    flex-direction: column;
    align-items: center;
}

.iziToast .iziToast-body .iziToast-icon {
    margin: 2px 12px 0 0 !important;
}

/* Buttons */
.iziToast .iziToast-buttons {
    margin-top: 8px !important;
}

.iziToast .iziToast-buttons button {
    background: transparent !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #e4e4e7 !important;
    padding: 4px 12px !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    margin-right: 8px !important;
    font-family: inherit !important;
}

.iziToast .iziToast-buttons button:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
}

/* Primary button style for actions */
.iziToast .iziToast-buttons button.primary,
.iziToast .iziToast-buttons button[data-primary='true'] {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border-color: transparent !important;
    color: white !important;
}

.iziToast .iziToast-buttons button.primary:hover,
.iziToast .iziToast-buttons button[data-primary='true']:hover {
    opacity: 0.9 !important;
    transform: translateY(-1px) !important;
}

/* Animation Overrides */
.iziToast.iziToast-opening {
    /*animation: iziToastSlideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;*/
}

.iziToast.iziToast-closing {
    /*animation: iziToastSlideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;*/
}

@keyframes iziToastSlideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes iziToastSlideOutRight {
    from {
        transform: translateX(0) scale(1);
        opacity: 1;
    }
    to {
        transform: translateX(100%) scale(0.95);
        opacity: 0;
    }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
    .iziToast {
        min-width: auto !important;
        max-width: calc(100vw - 20px) !important;
        margin: 0 10px !important;
    }
}

/* Custom GPTunes themes for special cases */
.iziToast.iziToast-theme-gptunes-primary {
    background: rgba(102, 126, 234, 0.1) !important;
    border: 1px solid #667eea !important;
}

.iziToast.iziToast-theme-gptunes-primary .iziToast-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    border-radius: 50% !important;
    width: 24px !important;
    height: 24px !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.iziToast.iziToast-theme-gptunes-primary .iziToast-progressbar > div {
    background: linear-gradient(90deg, #667eea, #764ba2) !important;
}

/* Dark overlay for toast container */
.iziToast-overlay {
    background: rgba(0, 0, 0, 0.1) !important;
    backdrop-filter: blur(2px) !important;
}

/* Wrapper positioning */
.iziToast-wrapper {
    pointer-events: none !important;
}

.iziToast-wrapper .iziToast {
    pointer-events: auto !important;
}

/* Loading state for async actions */
.iziToast.loading .iziToast-buttons button {
    opacity: 0.6 !important;
    cursor: not-allowed !important;
}

.iziToast.loading .iziToast-buttons button:hover {
    transform: none !important;
    background: transparent !important;
}

/* Special styling for music-related toasts */
.iziToast.music-toast .iziToast-icon::before {
    content: '♪' !important;
    font-size: 14px !important;
    font-weight: bold !important;
}

/* Pulse animation for important notifications */
.iziToast.pulse {
    animation: iziToastPulse 2s ease-in-out infinite !important;
}

@keyframes iziToastPulse {
    0%,
    100% {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    50% {
        box-shadow:
            0 10px 30px rgba(102, 126, 234, 0.2),
            0 0 0 4px rgba(102, 126, 234, 0.1);
    }
}
</style>

<style lang="scss" scoped>
.layout {
    width: 100%;
    height: 100%;
    display: flex;
}
.sidebar {
    width: 80px;
    height: 100%;
}
main {
    flex-grow: 1;
    height: 100%;
    max-width: 100%;
}

header {
    background: rgba(20, 20, 30, 0.1);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.model-selector {
    select {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f4f4f5;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        &:focus {
            outline: 1px solid rgba(102, 126, 234, 0.5);
        }
    }
}

.header-controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

.music-source-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
    }
    
    select {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f4f4f5;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        &:focus {
            outline: 1px solid rgba(102, 126, 234, 0.5);
        }
    }
}

.confirm-dialog-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
}
.confirm-dialog {
    background: rgba(15, 15, 25, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 0;
    max-width: 400px;
    width: 90%;
    color: #f4f4f5;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
    
    /* Center the dialog */
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    
    &::backdrop {
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
    }
    
    .dialog-content {
        padding: 24px;
        
        h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            color: #f4f4f5;
        }
        
        p {
            margin: 0 0 24px 0;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
        }
    }
    
    .dialog-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        
        button {
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .cancel-btn {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #a1a1aa;
            
            &:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.3);
                color: #f4f4f5;
            }
        }
        
        .confirm-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            
            &:hover {
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                transform: translateY(-1px);
            }
        }
    }
}

.logo-primary {
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.logo-primary:hover {
    filter: drop-shadow(0 10px 25px rgba(102, 126, 234, 0.3));
}

.logo-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.logo-icon::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
    0% {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    50% {
        transform: translateX(0%) translateY(0%) rotate(45deg);
    }
    100% {
        transform: translateX(100%) translateY(100%) rotate(45deg);
    }
}

.logo-symbol {
    font-size: 24px;
    font-weight: bold;
    color: white;
    z-index: 2;
    position: relative;
}

.logo-text {
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -1px;
    position: relative;
}

.logo-text::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
    opacity: 0;
    transform: scaleX(0);
    transition: all 0.5s ease;
}

/* Animated Waveform */
.sound-wave {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: 8px;
}

.wave-bar {
    width: 3px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 2px;
    animation: wave-pulse 1.5s ease-in-out infinite;
}

.wave-bar:nth-child(1) {
    height: 12px;
    animation-delay: 0s;
}

.wave-bar:nth-child(2) {
    height: 20px;
    animation-delay: 0.2s;
}

.wave-bar:nth-child(3) {
    height: 16px;
    animation-delay: 0.4s;
}

.wave-bar:nth-child(4) {
    height: 24px;
    animation-delay: 0.6s;
}

.wave-bar:nth-child(5) {
    height: 8px;
    animation-delay: 0.8s;
}

@keyframes wave-pulse {
    0%,
    100% {
        transform: scaleY(0.5);
        opacity: 0.7;
    }
    50% {
        transform: scaleY(1);
        opacity: 1;
    }
}
</style>
