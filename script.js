let localStream;
const app_id = "438b0a9bb09b4df992cad2765963018d"
const token = null; 
const uid = String(Math.floor(Math.random() * 10000 ))
let client
// let client;
let channel;
// const client = await AgoraRTM.createInstance(app_id)
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

    // channel = client.createChannel(roomID)
    channel = client.createChannel('main')
    await channel.join()

    channel.on('MemberJoined', handleUserJoined)
    client.on('MessageFromPeer', handleMessageFromPeer)


     localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //change the audio back to true when testing with another device
    console.log("here")
    document.getElementById('client-1').srcObject = localStream
    
    
    // createOffer()
    // console.log("called the function")


}

const handleMessageFromPeer= async (message, memberId) => {
    message = JSON.parse(message.text)
    console.log('Message: ', message)

}

const handleUserJoined = async(MemberId)=> {

    console.log('A new user joined the rom', MemberId)
    createOffer(MemberId)
    console.log("called the function")
}

let createPeerConnection  = async (memberId) => {

    const peerConnection = new RTCPeerConnection(servers)

    const remoteStream = new MediaStream()
    document.getElementById('client-2').srcObject = remoteStream

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
    // const peerConnection = new RTCPeerConnection(servers)

    // const remoteStream = new MediaStream()
    // document.getElementById('client-2').srcObject = remoteStream

    // if (!localStream) {
    //     localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}) //change the audio back to true when testing with another device
    //     console.log("checking localstream")
    //     document.getElementById('client-1').srcObject = localStream

    // }
    // localStream.getTracks().forEach((track) => {
    //     peerConnection.addTrack(track, localStream)
    // })

    // peerConnection.ontrack = (event) => {
    //     event.streams[0].getTracks().forEach((track) => {
    //         remoteStream.addTrack(track)
    //     })
    // }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate) {
            //websocket to send icecandidates
            client.sendMessageToPeer({text: JSON.stringify({'type': 'candidate', 'candidate': event.candidate})}, MemberId)

        }
    }

    const offer = await peerConnection .createOffer()
    await peerConnection.setLocalDescription(offer)
    //websocket to send message to peer
    client.sendMessageToPeer({text: JSON.stringify({'type': 'offer', 'offer': offer})}, MemberId)
    // console.log('Offer:', offer)
}

let createAnswer = async (memberId) => {

}


init()