<script setup>
import * as THREE from 'three'
import { ref, onMounted } from 'vue'
import useThreeScene from './composables/useThreeScene'
import useAudioVisualizer from './composables/useAudioVisualizer'

import LoadingIco from './components/LoadingIco.vue'
import PageWrap from './components/PageWrap.vue'
import Header from './components/Header.vue'
import FooterInfo from './components/FooterInfo.vue'

const webgl = ref(null)

// Loading Manager
const loadingManager = new THREE.LoadingManager(
    () => {
        loading.value = false
        isPlaying.value = false
    },
    (file, loaded, total) => {
        const progress = loaded / total
        console.log(`Loading audio: ${progress * 100}%`)
    }
)

// const loading = ref(true)
const { isPlaying, analyser, togglePlay, initAudio, loading } = useAudioVisualizer(loadingManager)
const { initScene } = useThreeScene(webgl)

onMounted(() => {
    initAudio('/PSR-B0950-08-0.mp3')
    initScene(analyser) // 傳入 analyser ref
})
</script>

<template>
    <PageWrap>
        <Header />
        <div v-if="loading" class="z-10 h-dvh inset-0 flex items-center justify-center">
            <LoadingIco />
        </div>

        <button
            v-else
            @click="togglePlay"
            class="absolute z-10 top-10/12 sm:top-9/12 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-zinc-700 cursor-pointer hover:border-white rounded-2xl w-20 h-8 sm:w-20 sm:h-8 bg-white text-stone-950 opacity-60 hover:opacity-100 font-extralight text-xs"
        >
            {{ isPlaying ? 'PAUSE' : 'PLAY' }}
        </button>

        <div class="absolute z-20 top-20 sm:top-30 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <a href="https://en.wikipedia.org/wiki/PSR_B0950%2B08" target="_blank">
                <p class="text-white text-[10px] font-light">PSR B0950+08</p>
            </a>
        </div>

        <div class="outline-none w-full h-dvh" ref="webgl"></div>

        <FooterInfo>
            <template v-slot:first>
                <a
                    href="https://www.youtube.com/watch?v=7eDGJ5okDGw&list=WL&index=21&t=1730s&ab_channel=AThousandJoys"
                    target="_blank"
                    class="underline-offset-2 font-medium"
                    >Pulsar signals by A Thousand Joys - unknown-pleasures</a
                >
            </template>
            <template v-slot:second> </template>
            <template v-slot:github>
                <a href="https://github.com/pccathome/earth" target="_blank" class="underline-offset-2">GitHub</a>
            </template>
        </FooterInfo>
    </PageWrap>
</template>
