//New ES6 Modules are used to load functions from external files
import { JuliaFragSouce } from "./Shaders/julia.frag.js";
import { JuliaVertSouce } from "./Shaders/julia.vert.js";
import { CreateShaderProgram, InitBuffers } from "./webGLInit.js";
import { ChangeSong, AnalyserInit, AnalyserUpdate, audioData, TogglePlayback, playback, GetPlaybackTime, SetPlaybackTime, GetEndTime, ChangeBass } from "./audioAnalysis.js";
"use strict"

//WebGL Environment
let gl;
let buffers;

//Shaders
let JuliaShader;

//Variables
let jSeedAInitial = .49;
let jSeedBInitial = .57;
let jSeedA = jSeedAInitial;
let jSeedB = jSeedBInitial;
let startTime = 0;
let time = 0;
let deltaTime = 0;
let rotation = 0;
let translation = 0;
let multiplyer = 0;
let previousAudioDataSum = 0;
let previousData = [];

//Input Variables
let orbits = false, rotating = true, monochrome = false;
let folded = true;
let rate = 2.5;

//Functions
function init() {
    gl = document.querySelector("#glCanvas").getContext("webgl");
    if (gl === null) {
        alert("WebGL is required to run this app!");
    }

    AnalyserInit();

    const JuliaShaderProgram = CreateShaderProgram(gl, JuliaVertSouce, JuliaFragSouce);

    JuliaShader = {
        program: JuliaShaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(JuliaShaderProgram, "aVertexPosition"),
            textureCoord: gl.getAttribLocation(JuliaShaderProgram, 'aTexCoord'),
            vertexColor: gl.getAttribLocation(JuliaShaderProgram, "aVertexColor")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(JuliaShaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(JuliaShaderProgram, 'uModelViewMatrix'),
            seed: gl.getUniformLocation(JuliaShaderProgram, 'uSeed'),
            multiplyer: gl.getUniformLocation(JuliaShaderProgram, 'multiplyer')
        },
    };

    buffers = InitBuffers(gl);
    startTime = new Date();

    initInputs();

    update();
}
function initInputs() {
    getElement("#playbackTime").max = GetEndTime();
    getElement("#playbackTime").oninput = function () { SetPlaybackTime(this.value); };
    getElement("#orbits").oninput = function () { orbits = this.checked; };
    getElement("#rotation").oninput = function () { rotating = this.checked; };
    getElement("#monochrome").oninput = function () { monochrome = this.checked; };
    getElement("#play").onclick = function () { TogglePlayback(); if(playback) this.value = "||"; else this.value = "|>"; getElement("#playbackTime").max = GetEndTime();};
    getElement("#type1").onclick = function () { folded = true; };
    getElement("#type2").onclick = function () { folded = false; };
    getElement("#rate").oninput = function () { rate = 5 - this.value; }
    getElement("#volume").oninput = function () { getElement("#audio").volume = this.value; }
    getElement("#bass").oninput = function () { ChangeBass(this.value); };
    getElement("#song").oninput = function () { ChangeSong(this.value); timeUpdate(); getElement("#play").value = "|>";};
    getElement("#fullscreen").onclick = function () {getElement("#glCanvas").requestFullscreen();}
}
let x = 0;
let y = 0;
//Update Functions--------------------------------------
//Call all update functions
function update() {
    if (!playback) { requestAnimationFrame(update); return };
    AnalyserUpdate();
    timeUpdate();
    draw();

    let audioDataSum = 1;
    audioData.forEach(function (element) {
        audioDataSum += element;
    });

    previousData.push(audioDataSum);
    if (previousData.length > 128) previousData.shift();

    let peaks = [];
    let slope = -1;
    for (let i = 0; i < previousData.length - 1; i++) {
        let currentSlope = previousData[i + 1] - previousData[i];
        if (currentSlope < 0 && slope > 0) peaks.push(i);
        slope = currentSlope;
    }
    let i = 0;
    let peakAverageInterval = 0;
    for (; i < peaks.length - 1; i++) {
        peakAverageInterval += peaks[i + 1] - peaks[i];
    }
    peakAverageInterval /= i;
    peakAverageInterval *= deltaTime;

    if (isNaN(peakAverageInterval)) { requestAnimationFrame(update); return };

    y += (audioData[16] + Math.pow(audioData[32], 2) + Math.pow(audioData[48], 2) + 1) / audioDataSum;

    x += ((audioDataSum - previousAudioDataSum / 256) / audioData.length) / 600;

    jSeedA = (Math.sin(x / rate) + 1) / 2;
    jSeedB = Math.sin(y / rate);

    if (rotating) {
        rotation += folded ? (Math.PI / 2) * peakAverageInterval / 16 : .005; //deltaTime * .3;
    }
    translation = Math.sin((1) * 2 * Math.PI) / 5;
    multiplyer = 2.5 * (1 + (audioDataSum / 256) / audioData.length);

    previousAudioDataSum = audioDataSum;

    requestAnimationFrame(update);
}
//Update variables that keep track of time
function timeUpdate() {
    let currentTime = GetPlaybackTime();
    deltaTime = currentTime - time;
    time = currentTime;
    getElement("#playbackTime").value = time;
}
//Render the current scene
function draw() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Create ModelView Matrix
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
    mat4.translate(projectionMatrix, projectionMatrix, [0, 0, -3.25]);

    gl.useProgram(JuliaShader.program);
    //Attributes--------------------------------------------------------------
    //Send Vertex Buffer to Vertex Shader
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.vertexAttribPointer(
            JuliaShader.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(JuliaShader.attribLocations.vertexPosition);
    }
    //Send Texture Coordinates to Vertex Shader
    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoords);
        gl.vertexAttribPointer(JuliaShader.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(JuliaShader.attribLocations.textureCoord);
    }
    //Send Color to Vertex Shader
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, monochrome ? buffers.monochrome : buffers.color);
        gl.vertexAttribPointer(
            JuliaShader.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            JuliaShader.attribLocations.vertexColor);
    }
    //Uniforms-----------------------------------------------------------------
    //Send Projection Matrix to Vertex Shader
    gl.uniformMatrix4fv(
        JuliaShader.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );
    //Send Seed to Pixel Shader
    gl.uniform2f(
        JuliaShader.uniformLocations.seed,
        jSeedA,
        jSeedB
    );
    //Send Brightness Multiplyer to Pixel Shader
    gl.uniform1f(
        JuliaShader.uniformLocations.multiplyer,
        multiplyer
    );

    //Draw Calls
    for (let i = 0; i < 4; i++) {
        {
            const modelViewMatrix = mat4.create();
            mat4.rotate(modelViewMatrix, modelViewMatrix, -(Math.PI / 4) * (1 + 2 * (i + 1)), [0, 0, -1]);
            mat4.translate(modelViewMatrix, modelViewMatrix, [folded ? translation : 1, 0, 0]);
            mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, -1, 0]); mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 2, [1, 0, 0]);

            //Send ModelView Matrix to Vertex Shader
            gl.uniformMatrix4fv(
                JuliaShader.uniformLocations.modelViewMatrix,
                false,
                modelViewMatrix
            );
            const indexCount = 24;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, indexCount, type, offset);
        }
        if (orbits) {
            const modelViewMatrix = mat4.create();
            mat4.scale(modelViewMatrix, modelViewMatrix, [1.5, 1.5, 1.5]);
            mat4.rotate(modelViewMatrix, modelViewMatrix, -(Math.PI / 4) * (1 + 2 * (i + 1)) + rotation / 10, [0, 0, -1]);
            mat4.translate(modelViewMatrix, modelViewMatrix, [1.5, 0, -2]);
            mat4.rotate(modelViewMatrix, modelViewMatrix, -rotation, [0, -1, 0]); mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 2, [1, 0, 0]);

            //Send ModelView Matrix to Vertex Shader
            gl.uniformMatrix4fv(
                JuliaShader.uniformLocations.modelViewMatrix,
                false,
                modelViewMatrix
            );
            const indexCount = 24;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, indexCount, type, offset);
        }
    }
    {
        const modelViewMatrix = mat4.create();
        mat4.scale(modelViewMatrix, modelViewMatrix, [.5, .5, .5]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 2, [1, 0, 0]);

        //Send ModelView Matrix to Vertex Shader
        gl.uniformMatrix4fv(
            JuliaShader.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        const indexCount = 24;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, indexCount, type, offset);
    }
}

//Helper Functions---------------------------------------
function getElement(elementID) {
    return document.querySelector(elementID);
}

window.onload = init;

//https://stackoverflow.com/questions/17537879/in-webgl-what-are-the-differences-between-an-attribute-a-uniform-and-a-varying
//https://stackoverflow.com/questions/11216912/webgl-shader-errors
//http://nuclear.mutantstargoat.com/articles/sdr_fract/
//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL
//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
