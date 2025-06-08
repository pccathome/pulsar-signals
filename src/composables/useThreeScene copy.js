import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onBeforeUnmount, ref, computed } from 'vue'

import vertexShader from '../shaders/line/vertex.glsl'
import fragmentShader from '../shaders/line/fragment.glsl'
import planeFragmentShader from '../shaders/plane/fragment.glsl'
import { map, lerp } from '../utils/math.js'

export default function useThreeScene(webglRef) {
    const scene = new THREE.Scene()
    let renderer, camera, controls, sizes, linesCount, linesList, lineGeometry, planeGeometry, group, clock
    let animationFrameId = null
    let externalAnalyser = null
    const webgl = ref(webglRef)
    const togglePlay = ref(false)

    // Resize
    sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: Math.min(window.devicePixelRatio, 2)
    }

    const initScene = (externalAnalyserRef) => {
        externalAnalyser = externalAnalyserRef
        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.setClearColor('#021119')

        // Camera
        camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 300)
        camera.position.set(0, 10, -9.5)

        // Controls
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enabled = false

        // lines
        linesCount = ref(96)
        linesList = computed(() => Array.from({ length: linesCount.value }, (_, i) => i))

        lineGeometry = new THREE.BoxGeometry(5.5, 0.03, 0.02, 128, 1, 1)
        planeGeometry = new THREE.PlaneGeometry(5.5, 1.5, 128, 1)

        group = new THREE.Group()

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

        const handleResize = () => {
            // Update sizes
            sizes.width = window.innerWidth
            sizes.height = window.innerHeight

            // Update camera
            camera.aspect = sizes.width / sizes.height
            camera.updateProjectionMatrix()

            // Update renderer
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            renderer.setSize(sizes.width, sizes.height)
        }

        window.addEventListener('resize', handleResize)

        // Animate
        clock = new THREE.Clock()

        const tick = () => {
            const elapsedTime = clock.getElapsedTime()

            const frequencies = externalAnalyser?.value?.getFrequencyData()

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

            animationFrameId = window.requestAnimationFrame(tick)
        }

        webgl.value.appendChild(renderer.domElement)
        tick() // 啟動動畫循環
    }

    const cleanup = () => {
        // 取消動畫幀請求
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId)
            animationFrameId = null
        }

        // 移除事件監聽器
        window.removeEventListener('resize', handleResize)

        // 釋放幾何體和材質
        if (lineGeometry) lineGeometry.dispose()
        if (planeGeometry) planeGeometry.dispose()

        // 清理場景中的對象
        if (group) {
            group.children.forEach((object) => {
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((material) => material.dispose())
                    } else {
                        object.material.dispose()
                    }
                }
                if (object.geometry) object.geometry.dispose()
            })
            scene.remove(group)
        }

        // 釋放渲染器資源
        if (renderer) {
            renderer.dispose()
            if (webgl.value && webgl.value.contains(renderer.domElement)) {
                webgl.value.removeChild(renderer.domElement)
            }
        }

        // 釋放控制器
        if (controls) controls.dispose()
    }

    onBeforeUnmount(cleanup)

    return {
        initScene,
        scene,
        renderer,
        camera,
        controls,
        sizes,
        clock,
        animationFrameId,
        externalAnalyser,
        webgl,

        cleanup
    }
}
