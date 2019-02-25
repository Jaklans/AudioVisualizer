import { JuliaFragSouce } from "./Shaders/julia.frag.js";
import { JuliaVertSouce } from "./Shaders/julia.vert.js";
import { CreateShaderProgram, InitBuffers } from "./webGLInit.js";
import { AnalyserInit, AnalyserUpdate, audioData, TogglePlayback, playback, GetPlaybackTime } from "./audioAnalysis.js";
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

//Input Variables
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
    getElement("#aInitial").value = jSeedAInitial;
    getElement("#aInitial").oninput = function () {
        jSeedAInitial = parseFloat(this.value);
    };

    getElement("#bInitial").value = jSeedBInitial;
    getElement("#bInitial").oninput = function () {
        jSeedBInitial = parseFloat(this.value);
    };

    getElement("#aMod").oninput = function () {
        jSeedAInitial = this.value;
    };
    getElement("#bMod").oninput = function () {
        jSeedAInitial = this.value;
    };
    getElement("#play").onclick = function () { TogglePlayback(); };
}
let i = 0;
let j = 0;
//Update Functions--------------------------------------
//Call all update functions
function update() {
    if(!playback) {requestAnimationFrame(update);return};
    AnalyserUpdate();
    timeUpdate();
    draw();

    let audioDataSum = 1;
    audioData.forEach(function (element) { 
        audioDataSum += element;
    });

    j += (audioData[16] + Math.pow(audioData[32], 2) + Math.pow(audioData[48], 2) + 1) / audioDataSum;

    i += ((audioDataSum - previousAudioDataSum / 256) / audioData.length) / 1500;
    
    jSeedA = (Math.sin(i/rate) + 1) / 2;
    jSeedB = Math.sin(j/rate);

    rotation += deltaTime * .3;
    translation = Math.sin((audioData[0] / 255) * 2 * Math.PI) / 5;
    multiplyer = 2.5 * (1 + (audioDataSum / 256) / audioData.length); 

    previousAudioDataSum = audioDataSum;

    requestAnimationFrame(update);
}
//Update variables that keep track of time
function timeUpdate() {
    let currentTime = GetPlaybackTime();
    deltaTime = currentTime - time;
    time = currentTime;
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
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
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
            mat4.translate(modelViewMatrix, modelViewMatrix, [translation, 0, 0]);
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
        {
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
            //gl.drawElements(gl.TRIANGLES, indexCount, type, offset);
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
