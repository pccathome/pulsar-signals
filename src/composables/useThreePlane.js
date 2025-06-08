import * as THREE from 'three'
import vertexShader from '../shaders/line/vertex.glsl'
import planeFragmentShader from '../shaders/plane/fragment.glsl'

export function createPlane(index, planeGeometry, uniforms) {
    const plane = new THREE.Mesh(
        planeGeometry,
        new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: planeFragmentShader,
            uniforms,
            side: THREE.DoubleSide
        })
    )

    plane.position.z = -index * 0.095
    plane.position.y = -0.75

    return { plane }
}

export function createPlaneGeometry() {
    return new THREE.PlaneGeometry(5.5, 1.5, 128, 1)
}
