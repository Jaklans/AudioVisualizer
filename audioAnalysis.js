export { ChangeSong, AnalyserInit, AnalyserUpdate, audioData, TogglePlayback, playback, GetPlaybackTime, SetPlaybackTime, GetEndTime, ChangeBass }

let ctx, analyser, bassBooster, audioElement;
const SAMPLE_COUNT = 64;
let audioData = new Uint8Array(SAMPLE_COUNT);
let playback = false;

function AnalyserInit() {
    ctx = new AudioContext();

    analyser = ctx.createAnalyser();

    bassBooster = ctx.createBiquadFilter(audioElement);
    bassBooster.type = "lowshelf";
    bassBooster.frequency.value = 190;
    bassBooster.gain.value = 0;

    audioElement = document.querySelector("#audio");

    analyser.fftSize = SAMPLE_COUNT;

    ctx.createMediaElementSource(audioElement).connect(bassBooster);
    bassBooster.connect(analyser);
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

function SetPlaybackTime(time){
    audioElement.currentTime = time;
}

function GetEndTime(){
    return audioElement.duration;
}

function ChangeSong(newSong){
    document.querySelector("#audio").src = "Media/" + newSong;
    audioElement.currentTime = 0;
    playback = false;
}

function ChangeBass(value){
    bassBooster.gain.value = value;
}