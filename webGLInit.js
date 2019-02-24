export { CreateShaderProgram, InitBuffers }

function CreateShaderProgram(gl, vertexSource, fragmentSource) {
    let vert = LoadShader(gl, gl.VERTEX_SHADER, vertexSource);
    let frag = LoadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vert);
    gl.attachShader(shaderProgram, frag);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Shader initialization failed: " + + gl.getProgramInfoLog(shaderProgram));
    }

    return shaderProgram;
}
function LoadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("A shader failed to compile: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}
function InitBuffers(gl) {
    //Create Position Buffer
    const positions = [
        0.0, -1.0, 0.0, //TipA
        0.0, 1.0, 0.0, //TipB
        -1.0, 0.0, 0.0, //2
        0.0, 0.0, 1.0, //3
        1.0, 0.0, 0.0, //4
        0.0, 0.0, -1.0  //5
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
        0, 2, 3,
        1, 3, 2,
        0, 3, 4,
        1, 4, 3,
        0, 4, 5,
        1, 5, 4,
        0, 5, 2,
        1, 2, 5
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
        1.0, 1.0,
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
        1.0, 1.0, 1.0, 1.0,    // white
        1.0, 1.0, 1.0, 1.0,    // white
        1.00, .827, 0, 1.0,    // red
        .243, .008, 1.00, 1.0, // blue
        1.0, 0.0, 0.0, 1.0,    // white
        0.0, 1.0, 0.0, 1.0,    // red
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

        color: colorBuffer
    };
}