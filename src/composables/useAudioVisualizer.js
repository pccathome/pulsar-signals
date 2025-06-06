import { ref, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

export default function useAudioVisualizer(loadingManager) {
    const isPlaying = ref(false)
    const audio = ref(null)
    const analyser = ref(null)
    const loading = ref(true)
    const listener = ref(null)
    const fftSize = 2048

    const initAudio = (filePath) => {
        listener.value = new THREE.AudioListener()
        audio.value = new THREE.Audio(listener.value)
        const audioLoader = new THREE.AudioLoader(loadingManager)

        audioLoader.load(
            filePath,
            (buffer) => {
                audio.value.setBuffer(buffer)
                analyser.value = new THREE.AudioAnalyser(audio.value, fftSize)
                loading.value = false
            },
            undefined,
            (error) => {
                console.error('Audio loading failed:', error)
                loading.value = false
            }
        )
    }

    const playAudio = () => {
        return listener.value.context
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

    const togglePlay = () => {
        if (isPlaying.value) {
            pauseAudio()
        } else {
            playAudio()
        }
    }

    const cleanup = () => {
        if (audio.value) {
            // 停止音頻播放
            if (audio.value.isPlaying) {
                audio.value.stop()
            }
            audio.value.disconnect()
        }

        // 清理分析器
        if (analyser.value) {
            analyser.value = null
        }

        // 清理監聽器
        if (listener.value) {
            listener.value = null
        }

        // 重置狀態
        isPlaying.value = false
        loading.value = true
    }

    // 在組件卸載時自動清理
    onBeforeUnmount(cleanup)

    return {
        isPlaying,
        loading,
        analyser,
        initAudio,
        togglePlay,
        cleanup
    }
}
