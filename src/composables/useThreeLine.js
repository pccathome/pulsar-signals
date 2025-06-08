import * as THREE from 'three'
import vertexShader from '../shaders/line/vertex.glsl'
import fragmentShader from '../shaders/line/fragment.glsl'

export function createLine(index, lineGeometry) {
    const uniforms = {
        uOffset: { value: index * 11 },
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

    line.position.z = -index * 0.095

    return { line, uniforms }
}

export function createLineGeometry() {
    return new THREE.BoxGeometry(5.5, 0.03, 0.02, 128, 1, 1)
}
