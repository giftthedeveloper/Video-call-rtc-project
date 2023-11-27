let remoteStream;

let init = async() => {
    const localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //change the audio back to true when testing with another device
    document.getElementById('client-1').srcObject = localStream
    
}

init()