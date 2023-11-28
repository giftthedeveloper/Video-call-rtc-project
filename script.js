let localStream;
const app_id = "438b0a9bb09b4df992cad2765963018d"
const token = null; 
const uid = String(Math.floor(Math.random() * 10000 ))

let client;
let channel;

const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

const init = async() => {
    const client = await AgoraRTM.createInstance(app_id)
    await client.login({uid, token})

    // channel = client.createChannel(roomID)
    channel = client.createChannel('main')
    await channel.join()

    channel.on('MemberJoined', handleUserJoined)


     localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //change the audio back to true when testing with another device
    console.log("here")
    document.getElementById('client-1').srcObject = localStream
    
    
    // createOffer()
    // console.log("called the function")


}

const handleUserJoined = async(MemberId)=> {

    console.log('A new user joined the rom', MemberId)
    createOffer(MemberId)
    console.log("called the function")
}

//create sdp offer for peer connection
const createOffer = async (MemberId) => {
    const peerConnection = new RTCPeerConnection(servers)
    const remoteStream = new MediaStream()
    document.getElementById('client-2').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate) {
            console.log('new icecandidate:', event.candidate)
        }
    }

    const offer = await peerConnection .createOffer()
    await peerConnection.setLocalDescription(offer)

    console.log('Offer:', offer)
}


init()