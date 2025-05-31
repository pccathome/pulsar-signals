<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import * as THREE from 'three'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import LoadingIco from './components/LoadingIco.vue'
import PageWrap from './components/PageWrap.vue'
import Header from './components/Header.vue'
import FooterInfo from './components/FooterInfo.vue'

import vertexShader from './shaders/line/vertex.glsl'
import fragmentShader from './shaders/line/fragment.glsl'
import planeFragmentShader from './shaders/plane/fragment.glsl'

// Refs & Globals
const webgl = ref(null)
const scene = new THREE.Scene()

// Resize
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

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

// Audio --------------------------------------
const isPlaying = ref(false)
const audio = ref(null)
const loading = ref(true)

function map(value, x1, y1, x2, y2) {
    return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2
}

const lerp = (a, b, t) => a * (1 - t) + b * t

const file = '/PSR-B0950-08-0.mp3'
const fftSize = 2048
const listener = new THREE.AudioListener()
audio.value = new THREE.Audio(listener)
const audioLoader = new THREE.AudioLoader(loadingManager)

audioLoader.load(file, function (buffer) {
    audio.value.setBuffer(buffer)
})

const togglePlay = () => {
    if (isPlaying.value) {
        pauseAudio()
    } else {
        playAudio()
    }
}

const playAudio = () => {
    listener.context
        .resume()
        .then(() => {
            audio.value.play()
            isPlaying.value = true
        })
        .catch((error) => {
            console.error('Failed to resume audio context:', error)
        })
}

const pauseAudio = () => {
    audio.value.pause()
    isPlaying.value = false
}

const analyser = new THREE.AudioAnalyser(audio.value, fftSize)

const setupScene = () => {
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setClearColor('#021119')

    // Camera
    const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 300)
    camera.position.set(0, 10, -9.5)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enabled = false

    // lines
    const linesCount = ref(96)
    const linesList = computed(() => Array.from({ length: linesCount.value }, (_, i) => i))

    const lineGeometry = new THREE.BoxGeometry(5.5, 0.03, 0.02, 128, 1, 1)
    const planeGeometry = new THREE.PlaneGeometry(5.5, 1.5, 128, 1)

    const group = new THREE.Group()

    linesList.value.forEach((_, i) => {
        const uniforms = {
            uOffset: { value: i * 11 },
            uStrength: { value: 1.5 },
            uTime: { value: 0 }
        }

        const line = new THREE.Mesh(
            lineGeometry,
            new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms
            })
        )

        line.position.z = -i * 0.095
        group.add(line)

        const plane = new THREE.Mesh(
            planeGeometry,
            new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader: planeFragmentShader,
                uniforms,
                side: THREE.DoubleSide
            })
        )
        plane.position.z = -i * 0.095
        plane.position.y = -0.75
        group.add(plane)

        // position center
        group.position.z = 6.5
        scene.add(group)
    })

    window.addEventListener('resize', () => {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(sizes.width, sizes.height)
    })

    // Animate
    const clock = new THREE.Clock()

    const tick = () => {
        const elapsedTime = clock.getElapsedTime()

        const frequencies = analyser.getFrequencyData()

        group.children.forEach((object, index) => {
            if (!object.material || !object.material.uniforms) return

            if ('uTime' in object.material.uniforms) {
                object.material.uniforms.uTime.value = elapsedTime
            }

            if (togglePlay) {
                const frequency = frequencies?.[index] ?? 0
                const currentStrength = object.material.uniforms.uStrength.value
                const nextStrength = map(frequency, 0, 255, 0, 1)
                object.material.uniforms.uStrength.value = lerp(currentStrength, nextStrength, 0.25)
            }
        })

        controls.update()

        renderer.render(scene, camera)

        window.requestAnimationFrame(tick)
    }

    tick()

    webgl.value.appendChild(renderer.domElement)
}

onMounted(() => {
    setupScene()
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
            <p class="text-white text-[10px] font-light">PSR B0950+08-0</p>
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
