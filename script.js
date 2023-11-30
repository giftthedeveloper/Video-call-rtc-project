let localStream;
const app_id = "438b0a9bb09b4df992cad2765963018d"
const token = null; 
const uid = String(Math.floor(Math.random() * 10000 ))


let client
// let client;
let channel;
// const client = await AgoraRTM.createInstance(app_id)

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if (!roomId){
    window.location = 'lobby.html'
}
const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

const init = async() => {
    client = await AgoraRTM.createInstance(app_id)
    await client.login({uid, token})

    channel = client.createChannel(roomId)
    // channel = client.createChannel('main')
    await channel.join()

    channel.on('MemberJoined', handleUserJoined)
    channel.on('MemberLeft', handleUserLeft)
    client.on('MessageFromPeer', handleMessageFromPeer)


     localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //change the audio back to true when testing with another device
    console.log("here")
    document.getElementById('client-1').srcObject = localStream
    
    
    // createOffer()
    // console.log("called the function")


}

const handleUserLeft = async (MemberId) => {
    document.getElementById('client-2').style.display = 'none'
}

const handleMessageFromPeer= async (message, MemberId) => {
    message = JSON.parse(message.text)

    if(message.type === 'offer') {
        createAnswer(MemberId, message.offer)
    }

    if(message.type === 'answer') {
        addAnswer(message.answer)
    }

    if(message.type === 'candidate') {
        if(peerConnection) {
            peerConnection.addIceCandidate(message.candidate)
        }
    }
    console.log('Message: ', message)

}

const handleUserJoined = async(MemberId)=> {

    console.log('A new user joined the rom', MemberId)
    createOffer(MemberId)
    console.log("called the function")
}

const createPeerConnection  = async (MemberId) => {

    peerConnection = new RTCPeerConnection(servers)

    const remoteStream = new MediaStream()
    document.getElementById('client-2').srcObject = remoteStream
    document.getElementById('client-2').style.display = 'block'


    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //change the audio back to true when testing with another device
        console.log("checking localstream")
        document.getElementById('client-1').srcObject = localStream

    }
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
            //websocket to send icecandidates
            client.sendMessageToPeer({text: JSON.stringify({'type': 'candidate', 'candidate': event.candidate})}, MemberId)

        }
    }

}

//create sdp offer for peer connection
const createOffer = async (MemberId) => {

    await createPeerConnection(MemberId)

    const offer = await peerConnection .createOffer()
    await peerConnection.setLocalDescription(offer)
    //websocket to send message to peer
    client.sendMessageToPeer({text: JSON.stringify({'type': 'offer', 'offer': offer})}, MemberId)
    // console.log('Offer:', offer)
}

const createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    client.sendMessageToPeer({text: JSON.stringify({'type': 'answer', 'answer': answer})}, MemberId)

}

const addAnswer = async(answer) => {
    if(!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer)
    }
}

const leaveChannel = async () => {
    await channel.leave()
    await client.logout()
}

window.addEventListener('beforeunload', leaveChannel)
init()