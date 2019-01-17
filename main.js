"use strict"

//WebGL Environment
let canvas;
let gl;
let shaderProgram;

//Shaders
let vert;
let frag;

//Functions


init();

init = {
    canvas = document.querySelector("#glCanvas");
    gl = canvas.getContext("webgl");

    if(gl === null){
        //Alert user
    }

    gl.clearColor(0.39, .58, 0.93, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    shaderProgram = initShaders(gl, vertSource, fragSource);
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

    instance.compileSource(shader, source);

    instance.compileShader(shader);

    if (!instance.getShaderParameter(shader, instance.COMPILE_STATUS)){
        alert("A shader failed to compile: " + instance.getShaderInfoLog(shader));
        instance.deleteShader(shader);
        return null;
    }

    return shader;
}

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