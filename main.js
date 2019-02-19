"use strict"

//WebGL Environment
let gl;
let buffers;

//Shaders
let JuliaShader;

//Assets
let JuliaSampler

//Functions
function init(){
    gl = document.querySelector("#glCanvas").getContext("webgl");
    if(gl === null){
        alert("WebGL is required to run this app!");
    }
    const vertSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTexCoord;
        attribute vec4 aVertexColor;

        uniform highp mat4 uModelViewMatrix;
        uniform highp mat4 uProjectionMatrix;

        varying highp vec2 textCoord;
        varying lowp vec4 vColor;

        void main() {
            textCoord = vec2(aTexCoord);
            vColor = aVertexColor;
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }`;
    const fragSource = `
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }`;
    const fragJuliaSource = `
        uniform sampler2D textureSampler;
        uniform highp vec2 c;

        varying highp vec2 textCoord;
        varying lowp vec4 vColor;

        void main() {
            gl_FragColor = vColor;
            return;
            const mediump int itter = 17;

            highp vec2 z = vec2(0.0, 0.0);
            z.x = 3.0 * (textCoord.x - 0.5);
            z.y = 2.0 * (textCoord.y - 0.5);
            //gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
            mediump int final;
            for(int i = 0; i < itter; i++) {
                lowp float x = (z.x * z.x - z.y * z.y) + c.x;
                lowp float y = (z.y * z.x + z.x * z.y) + c.y;

                if((x * x + y * y) > 4.0) return;
                z.x = x;
                z.y = y;

                final = i;
            }
            highp float finalf = float(final);
            //gl_FragColor = texture2D(textureSampler, vec2((final == itter ? 0.0 : finalf) / 100.0, 0.5));
            gl_FragColor = vec4(finalf / 50.0, 0.0, 0.0, 1.0);
            //gl_FragColor = vec4(final / 100.0, 0.0, 0.0, 1.0);
        }`;
//https://stackoverflow.com/questions/17537879/in-webgl-what-are-the-differences-between-an-attribute-a-uniform-and-a-varying
//https://stackoverflow.com/questions/11216912/webgl-shader-errors
//http://nuclear.mutantstargoat.com/articles/sdr_fract/
//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL
//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
    const shaderProgram = initShaders(gl, vertSource, fragJuliaSource);
    
    JuliaShader = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTexCoord'),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            textureSampler: gl.getUniformLocation(shaderProgram, 'textureSampler'),
            seed: gl.getUniformLocation(shaderProgram, 'c')
        },
    };

    buffers = initBuffers(gl);

    //Create Texture for Julia Fractal
    {
        JuliaSampler = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, JuliaSampler);
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 2;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const values = new Uint8Array([
            255, 0, 0, 255,
            0, 255, 0, 255
        ]);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat, 
            width, height, 
            border,
            srcFormat,
            srcType, 
            values);
        gl.activeTexture(gl.TEXTURE0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    update();
}

function update(){
    draw();
}

function draw(){
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
    const modelViewMatrix = mat4.create();
    mat4.translate(
        modelViewMatrix, // Destination
        modelViewMatrix, // Source
        [0.0,0.0,-6.0]
    );

    gl.useProgram(JuliaShader.program);
    //Attributes--------------------------------------------------------------
    //Send Vertex Buffer to Vertex Shader
    {
        const numComponents = 2;
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
    //Send ModelView Matrix to Vertex Shader
    //Send Seed to Pixel Shader
    gl.uniformMatrix4fv(
        JuliaShader.uniformLocations.modelViewMatrix,
        false, 
        modelViewMatrix
    );
    //Send Texture Sampler to Pixel Shader
    {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, JuliaSampler);
        gl.uniform1i(JuliaShader.uniformLocations.textureSampler, 0);
    }
    //Send Seed to Pixel Shader
    {
        const seed = vec2.create();
        vec2.x = .823459623;
        vec2.y = .125095467;
        gl.uniformMatrix4fv(
            JuliaShader.uniformLocations.modelViewMatrix,
            false, 
            modelViewMatrix
        );
    }

    //Draw Call
    {
        const indexCount = 6;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES,indexCount,type,offset);
    }
}

function initShaders(gl, vertexSource, fragmentSource){
    let vert = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    let frag = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vert);
    gl.attachShader(shaderProgram, frag);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert("Shader initialization failed: " +  + gl.getProgramInfoLog(shaderProgram));
    }

    return shaderProgram;
}

function loadShader(gl, type, source){
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert("A shader failed to compile: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initBuffers(gl) {
    //Create Position Buffer
    const positions = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
    );

    //Create Index Buffer
    const indices = [
        0, 1, 2,
        1, 2, 3
    ];
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );

    //Create Texture Coordinate Buffer
    const coordinates = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(coordinates),
        gl.STATIC_DRAW
    );

    //Create Color Buffer
    const colors = [
        1.0,  1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0,    // blue
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(colors),
        gl.STATIC_DRAW
    );

    return {
        position: positionBuffer,
        indices: indexBuffer,
        textureCoords: texCoordBuffer,

        color:colorBuffer
    };
}

window.onload = init;