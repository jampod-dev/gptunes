<
<template>
    <!-- prettier-ignore -->
    <div class="chat-window" :class="{'no-messages': !messages.length}">
        <div class="messages" v-if="messages.length" ref="messagesElement" role="log" aria-live="polite" aria-label="Playlist generation conversation">
            <div class="working" v-if="working" role="status" aria-live="polite" aria-label="Generating playlist"><loader /></div>
            <div v-for="message in messages" class="message-wrapper">
                <div class="message" :class="message.role">
                    <div v-if="message.role === 'user'" class="bubble">
                        {{message.content}}
                    </div>                    
                    <div v-else-if="message.type === 'playlist'" class="bubble playlist" :class="{ collapsed: message.collapsed }">
                        <div class="playlist-header">
                            <!-- Collapsed: show title text -->
                            <span v-if="message.collapsed" class="playlist-title" @click="message.collapsed = false">
                                {{ message.playlistName || 'Untitled playlist' }}
                            </span>
                            <!-- Expanded: show input field -->
                            <input 
                                v-else
                                type="text" 
                                class="playlist-title-input"
                                v-model="message.playlistName" 
                                placeholder="Name your playlist..." 
                                @click.stop 
                            />
                            <span class="track-count">{{ message.tracks.length }} tracks</span>

                            <button
                                v-if="message.collapsed"
                                class="collapse-button"
                                @click="message.collapsed = false"
                                :aria-label="`Expand playlist ${message.playlistName || 'Untitled playlist'}`"
                                aria-expanded="false"
                            >
                                <img src="~/public/img/chevron-down.svg" alt="" aria-hidden="true" />
                            </button>
                            <button
                                v-else
                                class="collapse-button"
                                @click="message.collapsed = true"
                                :aria-label="`Collapse playlist ${message.playlistName || 'Untitled playlist'}`"
                                aria-expanded="true"
                            >
                                <img src="~/public/img/chevron-up.svg" alt="" aria-hidden="true" />
                            </button>
                        </div>
                        <div class="playlist-content" v-show="!message.collapsed">
                                <draggable
                                    v-model="message.tracks"
                                    class="tracks"
                                    :animation="200"
                                    :ghostClass="'ghost'"
                                    :chosenClass="'chosen'"
                                    :dragClass="'drag'"
                                    :disabled="isMobile"
                                    item-key="id"
                                >
                                <template #item="{ element, index }">
                                    <div
                                        class="track"
                                        :class="{ playing: selectedTrack?.id === element.id }"
                                    >
                                        <div class="track-content" v-if="selectedTrack?.id !== element.id">
                                            <div class="left">
                                                <img class="draggable" src="~/public/img/draggable.svg" alt="" role="presentation" aria-hidden="true" />
                                                <div class="cover-play">
                                                    <img
                                                        class="play-button"
                                                        src="~/public/img/play.svg"
                                                        :alt="`Play ${element.title || element['title:']} by ${element.artist}`"
                                                        @click="selectTrack(element)"
                                                    />
                                                    
                                                    <div class="cover-wrapper">
                                                        <img class="cover" :src="element.cover" :alt="`Album cover for ${element.title || element['title:']} by ${element.artist}`" />
                                                    </div>
                                                </div>

                                                <div class="track-info">
                                                    <div class="title">{{ element.title || element['title:'] }} <img v-tippy="{content: element.reason, placement: isMobile ? 'left' : 'right'}" class="info" src="~/public/img/information-line.svg" alt="Information about why this track was selected" /></div>
                                                    <div class="artist">{{ element.artist }}</div>
                                                </div>
                                            </div>
                                            <div class="right">
                                                <!-- YouTube Link -->
                                                <a
                                                    v-if="selectedMusicSource === 'youtube'"
                                                    :href="element.externalUrl || `https://music.youtube.com/watch?v=${element.id}`"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="youtube-link"
                                                    title="Open in YouTube Music"
                                                >
                                                    <img
                                                        class="youtube-button"
                                                        src="~/public/img/youtube.svg"
                                                        alt="Open in YouTube Music"
                                                    />
                                                </a>
                                                <!-- Spotify Link -->
                                                <a
                                                    v-else
                                                    :href="element.externalUrl || `https://open.spotify.com/track/${element.id}`"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="spotify-link"
                                                    title="Open in Spotify"
                                                >
                                                    <img
                                                        class="spotify-button"
                                                        src="~/public/img/spotify.svg"
                                                        alt="Open in Spotify"
                                                    />
                                                </a>
                                                <img
                                                    class="delete-button"
                                                    src="~/public/img/delete.svg"
                                                    alt="Delete"
                                                    @click="message.tracks.splice(index, 1)"
                                                />
                                            </div>
                                        </div>
                                        <!-- YouTube Preview -->
                                        <div class="youtube-preview" v-else-if="selectedMusicSource === 'youtube'">
                                            <iframe
                                                :id="`embed-iframe-${element.id}`"
                                                :src="`https://www.youtube.com/embed/${element.id}?autoplay=1&enablejsapi=1&origin=${windowOrigin}`"
                                                width="100%"
                                                height="300"
                                                frameborder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowfullscreen
                                                :title="`YouTube player for ${element.title || element['title:']} by ${element.artist}`"
                                            ></iframe>
                                            <img
                                                class="close-button"
                                                src="~/public/img/delete.svg"
                                                :alt="`Close preview for ${element.title || element['title:']}`"
                                                @click="selectedTrack = null"
                                            />
                                        </div>
                                        <!-- Spotify Preview -->
                                        <div class="spotify-preview" v-else>
                                            <img class="draggable" src="~/public/img/draggable.svg" alt="" role="presentation" aria-hidden="true" />
                                            <iframe
                                                :id="`embed-iframe-${element.id}`"
                                                :src="`https://open.spotify.com/embed/track/${element.id}?utm_source=generator&theme=0`"
                                                width="100%"
                                                height="80"
                                                frameborder="0"
                                                allowtransparency="true"
                                                allow="encrypted-media; autoplay"
                                                :title="`Spotify player for ${element.title || element['title:']} by ${element.artist}`"
                                            ></iframe>
                                            <img
                                                class="close-button"
                                                src="~/public/img/delete.svg"
                                                :alt="`Close preview for ${element.title || element['title:']}`"
                                                @click="selectedTrack = null"
                                            />
                                        </div>
                                    </div>
                                </template>
                            </draggable>    
                            <span class="instructions" v-if="selectedMusicSource === 'youtube'">Click play to preview tracks via YouTube</span>
                            <span class="instructions" v-else>Click play to preview tracks via Spotify</span>
                        </div>
                    </div>
                   
                </div>
            </div>
        </div>
        <div class="intro">            
            <div class="input-wrapper" :class="{'bottom': messages.length}">
                <label for="playlist-description" class="visually-hidden">Playlist description</label>
                <textarea
                    id="playlist-description"
                    :rows="messages.length ? 0 : 5"
                    v-model="playlistDescription"
                    @keyup.enter="handleEnter($event)"
                    @blur="handleBlur"
                    aria-label="Describe your playlist to generate AI-powered music recommendations"
                    :placeholder="messages.length ? 'Describe your playlist' : placeholderText"
                    ></textarea>
                <div class="playlist-controls vertical" v-if="messages.length">
                    <button v-if="!creatingNew" @click.prevent="creatingNew = true" :disabled="working" aria-label="Start creating a new playlist">Create New</button>
                    <button v-else @click.prevent="createPlaylist" :disabled="working" aria-label="Generate new playlist with AI">Create</button>
                    <button v-if="!creatingNew" @click.prevent="refinePlaylist" :disabled="working" aria-label="Refine current playlist with additional instructions">Refine Playlist</button>
                    <label v-if="creatingNew" for="track-count-refine" class="visually-hidden">Number of songs</label>
                    <select v-if="creatingNew" v-model="trackCount" :disabled="working" id="track-count-refine" aria-label="Select number of songs for playlist">
                        <option v-for="length in lengths" :value="length" :key="length">{{length}} Songs</option>
                    </select>
                </div>
                <div class="playlist-controls" v-if="!messages.length">
                    <button @click.prevent="createPlaylist" aria-label="Create playlist with AI">Create Playlist</button>
                    <label for="track-count-initial" class="visually-hidden">Number of songs</label>
                    <select v-model="trackCount" id="track-count-initial" aria-label="Select number of songs for playlist">
                        <option v-for="length in lengths" :value="length" :key="length">{{length}} Songs</option>
                    </select>
                </div>      
            </div>
        
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import draggable from 'vuedraggable';
import Loader from '~/components/Spinner.vue';
import testMessages from '~/public/test-messages.js';
const { loggedIn, session, fetch, clear, openInPopup } = useUserSession();
const toast = useToast();

const playlistDescription = ref<string>('');
const trackCount = ref(10);
const selectedModel = useState('selectedModel', () => 'gemini-3-flash-preview');
const selectedMusicSource = useState('selectedMusicSource', () => 'youtube');

const messages = ref<any>([]);

const working = ref<boolean>(false);

const selectedTrack = ref<any>(null);
const messagesElement = ref(null);
const currentTracks = ref<any[]>([]);

const creatingNew = ref<boolean>(true);
const currentPlaylistId = ref<number | null>(null);

let ytPlayer: any = null;
let ytApiReady = false;
let spotifyController: any = null;
let spotifyIframeApi: any = null;

const lengths = ref([5, 10, 15]);

// Declare the global YouTube and Spotify API callbacks
declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
        onSpotifyIframeApiReady: (IFrameAPI: any) => void;
    }
}

onMounted(() => {
    // Load YouTube IFrame API
    if (typeof window !== 'undefined' && !window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            ytApiReady = true;
        };
    } else if (typeof window !== 'undefined' && window.YT) {
        ytApiReady = true;
    }

    // Set up Spotify IFrame API callback
    if (typeof window !== 'undefined') {
        window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
            spotifyIframeApi = IFrameAPI;
        };
    }

    nextTick(() => {
        scrollToBottom();
    });
});

// Watch for track changes and set up player based on music source
watch(selectedTrack, (newTrack) => {
    // Destroy previous YouTube player if exists
    if (ytPlayer) {
        try {
            ytPlayer.destroy();
        } catch (e) {
            // Player may already be destroyed
        }
        ytPlayer = null;
    }
    
    // Clear previous Spotify controller
    spotifyController = null;

    if (!newTrack) return;

    // Handle based on music source
    if (selectedMusicSource.value === 'youtube') {
        // YouTube player setup
        if (ytApiReady && typeof window !== 'undefined' && window.YT) {
            nextTick(() => {
                setTimeout(() => {
                    const iframeId = `embed-iframe-${newTrack.id}`;
                    const iframe = document.getElementById(iframeId);
                    
                    if (!iframe) return;
                    
                    ytPlayer = new window.YT.Player(iframeId, {
                        events: {
                            onReady: () => {
                                console.log('YouTube player ready');
                            },
                            onStateChange: (event: any) => {
                                if (event.data === 0) {
                                    playNextTrack();
                                }
                            },
                        },
                    });
                }, 500);
            });
        }
    } else {
        // Spotify player setup
        if (spotifyIframeApi) {
            nextTick(() => {
                setTimeout(() => {
                    const iframeId = `embed-iframe-${newTrack.id}`;
                    const iframe = document.getElementById(iframeId);
                    
                    if (!iframe) return;
                    
                    const options = {
                        uri: `spotify:track:${newTrack.id}`,
                        height: 80,
                    };
                    
                    spotifyIframeApi.createController(iframe, options, (controller: any) => {
                        spotifyController = controller;
                        
                        controller.addListener('ready', () => {
                            controller.play();
                        });
                        
                        controller.addListener('playback_update', (e: any) => {
                            const { position, duration } = e.data;
                            if (position > 10000 && position >= duration - 1000) {
                                playNextTrack();
                            }
                        });
                    });
                }, 300);
            });
        }
    }
});

const isMobile = computed(() => {
    if (typeof window !== 'undefined') {
        return window.innerWidth <= 767;
    }
    return false;
});

const windowOrigin = computed(() => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return '';
});

function handleBlur() {
    if (!messages.value.length) {
        window.scrollTo(0, 0);
    }
}

function selectTrack(track: any) {
    selectedTrack.value = null;
    nextTick(() => {
        selectedTrack.value = track;
    });
}

function playNextTrack() {
    if (!selectedTrack.value || !currentTracks.value.length) return;

    // Find the index of the current track
    const currentIndex = currentTracks.value.findIndex(
        (track) => track.id === selectedTrack.value.id
    );

    // If we found the current track and there's a next track, play it
    if (currentIndex !== -1 && currentIndex < currentTracks.value.length - 1) {
        const nextTrack = currentTracks.value[currentIndex + 1];
        selectTrack(nextTrack);
    } else {
        // End of playlist, close the player
        selectedTrack.value = null;
    }
}

function scrollToBottom() {
    nextTick(() => {
        if (messagesElement.value) {
            messagesElement.value.scrollTop = messagesElement.value.scrollHeight;
        }
    });
}
function handleEnter(event) {
    if (event.shiftKey) {
        return;
    }
    event.preventDefault();
    if (creatingNew.value) {
        createPlaylist();
    } else {
        refinePlaylist();
    }
}

async function refinePlaylist() {
    if (!playlistDescription.value.trim() || working.value) return;

    working.value = true;

    const instruction = playlistDescription.value.trim();

    playlistDescription.value = '';

    // Add user message
    messages.value.unshift({
        role: 'user',
        content: instruction,
    });

    try {
        const res = await $fetch(`/api/playlists/refine`, {
            method: 'POST',
            body: {
                instruction,
                currentTracks: currentTracks.value.map((t) => ({
                    artist: t.artist,
                    title: t.title,
                    reason: t.reason || '',
                })),
                numberOfTracks: trackCount.value,
                model: selectedModel.value,
                initialPrompt: messages.value[0],
                playlistId: currentPlaylistId.value,
                musicSource: selectedMusicSource.value,
            },
        });

        if (res.data.code === 'QUOTA_REACHED') {
            toast.warning({
                title: 'Quota reached',
                icon: '',
                message:
                    res.data.message ||
                    'You have reached your limit for playlist generation for now.',
                layout: 1,
                position: 'topCenter',
            });
        } else if (res.success) {
            currentTracks.value = res.data;

            messages.value.unshift({
                role: 'assistant',
                type: 'playlist',
                tracks: res.data,
                playlistName: res.playlistTitle || '',
                collapsed: false,
            });
        }
    } catch (error) {
        messages.value.unshift({
            role: 'assistant',
            content: 'Sorry, I had trouble processing that request. Please try again.',
        });
    } finally {
        working.value = false;
    }
}

async function createPlaylist() {
    const description = playlistDescription.value.trim();

    if (!description.trim() || working.value) {
        return;
    }

    if (description.length < 10) {
        toast.warning({
            title: 'Description too short',
            icon: '',
            message: 'Description is too short (min 10 characters)',
            layout: 1,
            position: 'topCenter',
        });
        return;
    }
    if (description.length > 1000) {
        toast.warning({
            title: 'Description too long',
            icon: '',
            message: 'Description is too long (max 1000 characters)',
            layout: 1,
            position: 'topCenter',
        });
        return;
    }

    creatingNew.value = false;

    selectedTrack.value = null;

    working.value = true;

    messages.value.unshift({
        role: 'user',
        content: description,
    });

    playlistDescription.value = '';

    try {
        const res = await $fetch('/api/playlists/tracks', {
            method: 'POST',
            body: {
                description: description,
                trackCount: trackCount.value,
                model: selectedModel.value,
                musicSource: selectedMusicSource.value,
            },
        });

        if (res.data.code === 'QUOTA_REACHED') {
            toast.warning({
                title: 'Quota reached',
                icon: '',
                message:
                    res.data.message ||
                    'You have reached your limit for playlist generation for now.',
                layout: 1,
                position: 'topCenter',
            });
        } else {
            if (!res.data.length) {
                toast.warning({
                    title: 'No tracks found',
                    icon: '',
                    message: 'No tracks were found for the given description.',
                    layout: 1,
                    position: 'topCenter',
                });
            } else {
                currentTracks.value = res.data;
                currentPlaylistId.value = res.playlistId;

                messages.value.unshift({
                    role: 'assistant',
                    type: 'playlist',
                    tracks: res.data,
                    playlistName: res.playlistTitle || '',
                    collapsed: false,
                });
            }
        }
        nextTick(() => {
            scrollToBottom();
        });
    } catch (error: any) {
        // Extract the actual error message from the server response
        const errorMessage =
            error?.data?.message ||
            error?.message ||
            'There was an error fetching tracks. Please try again later.';
        toast.error({
            title: 'Error',
            icon: '',
            message: errorMessage,
            layout: 1,
            position: 'topCenter',
        });
    } finally {
        working.value = false;
    }
}

const placeholderText = ref(
    `Tell the AI what you’re in the mood for—anything from “late-night lo-fi for coding in Tokyo cafés” to “up-tempo Quebec fiddle tunes that aren’t on every tourist mix.” Type a sentence, a story, or even a vibe (“rainy bus rides in Seattle, 1997”), and our generator spins it into a hand-picked playlist in seconds. No genre boxes, no endless scrolling—just say it, and we play it.`
);
</script>

<style lang="scss" scoped>
.chat-window {
    height: calc(100dvh - 67px);
    display: flex;
    flex-direction: column;
    width:48rem;
    max-width:100%;
    margin: 0 auto;
    padding-top: 1rem;
    &.no-messages {
        align-items: center;
        justify-content: center;
        .intro {
            width: 800px;
            @media screen and (max-width: 820px) {
                width: 90%;
            }
        }
    }
}

.input-wrapper {
    width: 100%;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    textarea {
        height: 200px;
        font-size: 18px;
        line-height: 1.4em;
        @media screen and (max-width: 640px) {
            height: 230px;
            // display: none;
            margin-bottom: 0.5rem;
            font-size: 16px;
        }
    }
    &.bottom {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 32px;
        font-size: initial;
        line-height: initial;
        @media screen and (max-width: 640px) {
            padding: 12px;
            flex-direction: column;
            gap: 0;
            align-items: flex-start;
        }
        textarea {
            height: auto;
        }
    }
}

.messages {
    padding: 0 32px;
    gap: 32px;
    display: flex;
    flex-flow: column nowrap;
    overflow-y: auto;
    flex-direction: column-reverse;

    height: 100%;
    flex: 1;
    @media screen and (max-width: 767px) {
        padding: 0 16px;
    }
    .message-wrapper {
        @media screen and (max-width: 767px) {
            width: auto;
            max-width: 100%;
        }
    }

    .message {
        display: flex;
        align-self: flex-end;
        input[type='text'] {
            font-size: 16px;
            font-family: 'Geist', serif;
            width: 100%;
            padding: 10px;
            border: none;
            background: #1e1c21;
            color: var(--text-white);
            border-radius: 4px;
            &:focus {
                outline: 1px solid #3a3a4b;
            }
            ::-webkit-input-placeholder {
                font-family: 'Geist', serif;
                color: var(--text-gray);
            }
        }
    }
    .user {
        justify-content: flex-end;
        .bubble {
            position: relative;
            &::before {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                opacity: 0.5;
                z-index: -1;
                border-radius: 6px;
                content: '';
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            color: white;
            border-bottom-right-radius: 6px;
        }
    }

    .bubble {
        max-width: 70%;
        padding: 16px 20px;
        border-radius: 18px;
        font-size: 16px;
        line-height: 1.5;
        word-wrap: break-word;
        @media screen and (max-width: 767px) {
            font-size: 18px;
        }
        &.playlist {
            width: 600px;
            max-width: 100%;
        }
    }
    .bubble.upgrade {
        display: inline-flex;
        flex-direction: column;
        align-content: flex-start;
        gap: 24px;
        a {
            max-width: 200px;
        }
    }
    .assistant .bubble {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #f4f4f5;
        border-bottom-left-radius: 6px;
        @media screen and (max-width: 767px) {
            max-width: 100%;
        }
    }
    .playlist {
        &.collapsed {
            .playlist-header {
                border-bottom: none;
                margin-bottom: 0;
            }
        }
        .playlist-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: opacity 0.2s ease;
            .playlist-title {
                font-weight: 600;
                font-size: 16px;
                color: #fff;
                flex: 1;
                cursor: pointer;
                &:hover {
                    opacity: 0.8;
                }
            }
            .playlist-title-input {
                flex: 1;
                font-weight: 600;
                font-size: 16px;
                color: #fff;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 6px 10px;
                font-family: inherit;
                &::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                &:focus {
                    outline: none;
                    border-color: rgba(102, 126, 234, 0.6);
                }
            }
            .track-count {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.5);
                white-space: nowrap;
            }
            .save-btn {
                padding: 6px 12px;
                font-size: 13px;
                white-space: nowrap;
            }
            .collapse-icon {
                width: 20px;
                height: 20px;
                opacity: 0.7;
                cursor: pointer;
                transition:
                    transform 0.2s ease,
                    opacity 0.2s ease;
                &:hover {
                    opacity: 1;
                }
            }
        }
        .playlist-content {
            animation: slideDown 0.2s ease;
        }
        .top-input {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }
    }
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .buttons {
        margin-top: 16px;
    }
}
.explanation {
    margin-bottom: 32px;
}
.playlist-controls {
    display: flex;
    gap: 4px;
    @media screen and (max-width: 640px) {
        flex-direction: row;
        gap: 1rem;
    }
    &.vertical {
        flex-direction: column;
        @media screen and (max-width: 640px) {
            flex-direction: row;
            gap: 0.5rem;
        }
    }
}
.tracks {
    background: #1a1a1a;
}
img.draggable {
    @media screen and (max-width: 767px) {
        display: none;
    }
}
.track {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding: 12px;
    cursor: move;
    border-bottom: 1px solid #3a3a4b;
    &.playing {
        background: rgba(255, 255, 255, 0.1);
        padding: 0;
    }
    .track-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        @media screen and (max-width: 767px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
    }
    .youtube-preview {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: 8px;
        padding: 8px 12px;
        position: relative;
        
        iframe {
            width: 100%;
            border-radius: 8px;
            min-height: 300px;
        }
        .close-button {
            position: absolute;
            top: 12px;
            right: 16px;
            width: 28px;
            height: 28px;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s ease;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 4px;
            padding: 4px;
            z-index: 10;
            &:hover {
                opacity: 1;
            }
        }
    }
    .spotify-preview {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 8px;
        padding: 8px 12px;
        .draggable {
            width: 22px;
            height: 22px;
            cursor: move;
            flex-shrink: 0;
        }
        iframe {
            flex: 1;
            border-radius: 8px;
            min-height: 80px;
        }
        .close-button {
            width: 24px;
            height: 24px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s ease;
            flex-shrink: 0;
            &:hover {
                opacity: 1;
            }
        }
    }
    .left {
        display: flex;
        align-items: center;
    }
    .cover-wrapper {
        width: 40px;
        height: 40px;
        overflow: hidden;
        border-radius: 4px;
        flex-shrink: 0;
        margin-right: 16px;
    }
    .cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        /* Scale up to crop out YouTube thumbnail letterboxing (black bars) */
        transform: scale(1.35);
    }
    .right {
        display: flex;
        align-items: center;
        gap: 8px;
        .spotify-link {
            display: flex;
            align-items: center;
        }
        img {
            width: 24px;
            height: 24px;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s ease;
            &:hover {
                opacity: 1;
            }
        }
    }
    .title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .info {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    .play-button {
        width: 24px;
        height: 24px;
        margin-right: 10px;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s ease;
        z-index:9;
        &:hover {
            opacity: 1;
        }
    }
    .title {
        font-weight: bold;
        font-size: 18px;
        color: var(--text-white);
    }
    .title {
        color: var(--text-grey);
    }

    .draggable {
        width: 22px;
        height: 22px;
        margin-right: 12px;
    }
}

.cover-play {
    flex-shrink: 0;
    position: relative;
    width: 40px;
    margin-right: 16px;
    height: 40px;
    img.cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
    }
    img.play-button {
        position: absolute;
        border: 2px solid;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 32px;
        height: 32px;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s ease;
    }
}
.working {
    padding-left: 16px;
    padding-bottom: 32px;
    @media screen and (max-width: 767px) {
        padding-left: 0px;
        padding-bottom: 16px;
    }
}
.youtube-link {
    display:inline-flex;
}

/* Accessibility - Visually hidden labels */
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

/* Collapse button styling */
.collapse-button {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 20px;
        height: 20px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }

    &:hover img {
        opacity: 1;
    }

    &:focus {
        outline: 2px solid rgba(102, 126, 234, 0.6);
        outline-offset: 2px;
        border-radius: 4px;
    }
}

.instructions {
    font-style: italic;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 0.5rem;
    display: inline-block;
    @media screen and (max-width: 767px) {
        font-size: 16px;
    }
}
.messages::-webkit-scrollbar {
    width: 8px;
}

.messages::-webkit-scrollbar-track {
    background: rgba(10, 10, 15, 0.8);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.messages::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
}

.messages::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #7c8ef0 0%, #8b5fb8 100%);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
    transform: scaleX(1.2);
}

.messages::-webkit-scrollbar-thumb:active {
    background: linear-gradient(180deg, #5a6fd8 0%, #6b4a96 100%);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.messages::-webkit-scrollbar-corner {
    background: transparent;
}

/* Firefox scrollbar styling */
.messages {
    scrollbar-width: thin;
    scrollbar-color: #667eea rgba(10, 10, 15, 0.8);
}

/* Enhanced scrollbar for input area if it becomes scrollable */
.input-container::-webkit-scrollbar {
    width: 6px;
}

.input-container::-webkit-scrollbar-track {
    background: rgba(10, 10, 15, 0.6);
    border-radius: 8px;
}

.input-container::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
    border-radius: 8px;
    transition: all 0.3s ease;
}

.input-container::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
}

</style>
