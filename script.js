const io = require('socket.io-client'); 
console.log("start")   
import { v4 as uuidv4 } from 'uuid';
const uid = uuidv4();
    
    let localStream;
    const app_id = "438b0a9bb09b4df992cad2765963018d"
    const token = null; 
    // const uid = String(Math.floor(Math.random() * 10000 ))
    let client
    let channel;
    let queryString = window.location.search
    let urlParams = new URLSearchParams(queryString)
    let roomId = urlParams.get('room')
    console.log("passed import statement")
    let audioTrack


// const socket = io('https://api-video-call-by-gift.onrender.com');
    const socket = io('http://127.0.0.1:3000');

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
    // client = await AgoraRTM.createInstance(app_id)
    // await client.login({uid, token})

    socket.emit('joinRoom', { room: roomId, userId: uid });

        // channel = client.createChannel(roomId)
        // channel = client.createChannel('main')
        // await channel.join()
        // channel.on('MemberJoined', handleUserJoined)
        // channel.on('MemberLeft', handleUserLeft)
        // client.on('MessageFromPeer', handleMessageFromPeer)
    
    socket.on('roomMemberJoined', (data) => {
        handleUserJoined(data.userId);
    });
    
    //this still needs work
    socket.on('memberLeft', (data) => {
        handleUserLeft(data.userId);
    });
    
    socket.on('messageFromPeer', (data) => {
        handleMessageFromPeer(data.content, data.userId);
    });
        
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true}) 
        document.getElementById('client-1').srcObject = localStream
        
        
        // createOffer()
        // console.log("called the function")
        createPopUp();
        console.log('pop up done')
    
    }


    const closePopUp = () => {
        console.log("Closing pop-up");
        const popUp = document.querySelector('.pop-up');
        console.log("here in pop up also")
        if (popUp) {
            console.log("here in pop up")
            popUp.remove();
        }
    };
    
    
    

    const createPopUp = () => {
        const popUp = document.createElement('div');
        popUp.className = 'pop-up';
    
        const popUpContent = document.createElement('div');
        popUpContent.className = 'pop-up-content';
    
        const closeBtnContainer = document.createElement('div');
        closeBtnContainer.className = 'close-btn-container';
    
        const closeBtn = document.createElement('button');
        closeBtn.id = 'close-btn'; 
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        console.log("Close button: ", closeBtn);
        closeBtn.addEventListener('click', () => {
            console.log("Close button clicked");
            closePopUp();
        });

        // Add closeBtn directly to popUpContent
        popUpContent.appendChild(closeBtn);

        popUp.appendChild(popUpContent);

        closeBtnContainer.appendChild(closeBtn);
    
        popUpContent.appendChild(closeBtnContainer);
    
        popUpContent.innerHTML += `
            
            <h4>This video call currently supports only 2 participants.</h4>
            <p>Share the following link to invite others:</p>
            <input type="text" id="meeting-link" value="${window.location.href}" readonly>
            <button onclick="copyMeetingLink()">Copy Link</button>
        `;
    
        popUp.appendChild(popUpContent);
    
        document.body.appendChild(popUp);
        document.getElementById('close-btn').addEventListener('click', closePopUp);
    };
    
    
    // window.addEventListener('beforeunload', closePopUp);

    window.copyMeetingLink = () => {
        const meetingLinkInput = document.getElementById('meeting-link');
        meetingLinkInput.select();
        document.execCommand('copy');
        alert('Meeting link copied to clipboard!');
    };
    
    const handleUserLeft = async (MemberId) => {
        document.getElementById('client-2').style.display = 'none'
        document.getElementById('client-1').classList.remove('small-frame')

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


        document.getElementById('client-1').classList.add('small-frame')

    
        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true}) 
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
    
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        //websocket to send message to peer
        // client.sendMessageToPeer({text: JSON.stringify({'type': 'offer', 'offer': offer})}, MemberId)
        socket.emit('sendMessage', {content: offer, type: 'offer', room: roomId, userId: MemberId});
          
    }
    
    const createAnswer = async (MemberId, offer) => {
        await createPeerConnection(MemberId)
    
        await peerConnection.setRemoteDescription(offer)
    
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        // client.sendMessageToPeer({text: JSON.stringify({'type': 'answer', 'answer': answer})}, MemberId)
        socket.emit('sendMessage', {content: anwer, type: 'answer', room: roomId, userId: MemberId});

    
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
    
    const toggleCamera = async () => {
        let videoTrack = localStream.getTracks().find(track => track.kind === 'video')
    
        if(videoTrack.enabled){
            videoTrack.enabled = false
            document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            videoTrack.enabled = true
            document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
        }
    
    }

    const toggleMic = async () => {
        audioTrack = localStream.getTracks().find(track => track.kind === 'audio')
    
        if(audioTrack.enabled){
            audioTrack.enabled = false
            document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            audioTrack.enabled = true
            document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
        }
    
    }
    
    

    // const toggleMic = async () => {
    //     let audioTrack = localStream.getAudioTracks()[0];
    
    //     if (audioTrack) {
    //         // Mute/unmute the audio track
    //         audioTrack.enabled = !audioTrack.enabled;
    
    //         // Create a new stream with the updated audio track
    //         const newStream = new MediaStream();
    //         newStream.addTrack(audioTrack);
    
    //         // Replace the local stream with the new stream
    //         document.getElementById('client-1').srcObject = newStream;
    
    //         // Update the mic-btn background color
    //         const micBtnColor = audioTrack.enabled ? 'rgb(179, 102, 249, .9)' : 'rgb(255, 80, 80)';
    //         document.getElementById('mic-btn').style.backgroundColor = micBtnColor;
    //     }
    // };
    
    
    
    window.addEventListener('beforeunload', leaveChannel)
    document.getElementById('camera-btn').addEventListener('click', toggleCamera)
    document.getElementById('mic-btn').addEventListener('click', toggleMic)

    init()
    
    




