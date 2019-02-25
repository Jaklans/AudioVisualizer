export { JuliaFragSouce }; const JuliaFragSouce = `  
    uniform highp vec2 uSeed;
    uniform highp float multiplyer;

    varying highp vec2 textCoord;
    varying highp vec4 vColor;


    void main() {
        const mediump int itter = 200;

        highp vec2 z = vec2(0.0, 0.0);
        z.x = 3.0 * (textCoord.x - 0.5);
        z.y = 2.0 * (textCoord.y - 0.5);
            
        mediump int final;
        for(int i = 0; i < itter; i++) {
            highp float x = (z.x * z.x - z.y * z.y) - uSeed.x;
            highp float y = (z.y * z.x + z.x * z.y) - uSeed.y;

            if((x * x + y * y) > 4.0) {
                final = i;
                break;
            }

            z.x = x;
            z.y = y;
        }
        highp float finalf = float(final);
        gl_FragColor = vColor * (finalf / 50.0) * multiplyer;
        gl_FragColor.w = 1.0;
    }`;