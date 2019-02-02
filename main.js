"use strict"

//WebGL Environment
let canvas;
let gl;
let shaderProgram;

//Shaders
let vert;
let frag;

const vertSource = `
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`;
const fragSource = `
void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

//Functions
function init(){
    canvas = document.querySelector("#glCanvas");
    gl = canvas.getContext("webgl");

    if(gl === null){
        //Alert user
    }

    gl.clearColor(0.39, .58, 0.93, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    shaderProgram = initShaders(gl, vertSource, fragSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

}

function update(){

}

function draw(){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
    );
}

function initShaders(instance, vertexSource, fragmentSource){
    vert = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    frag = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vert);
    gl.attachShader(shaderProgram, frag);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert("Shader initialization failed: " +  + gl.getProgramInfoLog(shaderProgram));
    }

    return shaderProgram;
}

function loadShader(instance, type, source){
    const shader = instance.createShader(type);

    instance.shaderSource(shader, source);

    instance.compileShader(shader);

    if (!instance.getShaderParameter(shader, instance.COMPILE_STATUS)){
        alert("A shader failed to compile: " + instance.getShaderInfoLog(shader));
        instance.deleteShader(shader);
        return null;
    }

    return shader;
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0,
    ];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);

    return {
        position: positionBuffer,
    };
}

window.onload = init();