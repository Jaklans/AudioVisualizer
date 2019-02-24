export { JuliaVertSouce }; const JuliaVertSouce = ` 
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