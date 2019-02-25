export { AnalyserInit, AnalyserUpdate, audioData, TogglePlayback, playback, GetPlaybackTime }

let ctx, analyser, audioElement;
const SAMPLE_COUNT = 64;
let audioData = new Uint8Array(SAMPLE_COUNT);
let playback = false;

function AnalyserInit() {
    ctx = new AudioContext();

    analyser = ctx.createAnalyser();
    audioElement = document.querySelector("#audio");

    analyser.fftSize = SAMPLE_COUNT;

    ctx.createMediaElementSource(audioElement).connect(analyser);
    analyser.connect(ctx.destination);
}

function AnalyserUpdate(){
    analyser.getByteFrequencyData(audioData);
}

function TogglePlayback(){
    playback = !playback;

    if (ctx.state == "suspended") {
        ctx.resume();
    }

    if (playback){
        audioElement.play();
    }
    else{
        audioElement.pause();
    }
}

function GetPlaybackTime(){
    return audioElement.currentTime;
}