'use strict';

var localConnection;
var remoteConnection;
var sendChannel;
var receiveChannel;
var pcConstraint;
var dataConstraint;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function createConnection() {
  var servers = null;
  //restrições null
  pcConstraint = null;
  dataConstraint = null;
  console.log('Cria a localConnection');
  window.localConnection = localConnection = new RTCPeerConnection(servers, pcConstraint);

  // cria o tunel local para comunicação
  sendChannel = localConnection.createDataChannel('sendDataChannel', dataConstraint);

  // adicionando o candidato 1
  localConnection.onicecandidate = iceCallback1;

  // criando conexao remota com os mesmos parametros
  window.remoteConnection = remoteConnection = new RTCPeerConnection(servers, pcConstraint);

  // crio o candidato remoto
  remoteConnection.onicecandidate = iceCallback2;
  remoteConnection.ondatachannel = receiveChannelCallback;

  localConnection.createOffer().then(gotDescription1, onCreateSessionDescriptionError);
  //desabilito textarea
  dataChannelSend.disabled = false;
}
// envia texto de local pra remoto
function sendData() {
  if (!dataChannelSend.value) {
    alert("Sem valores para transferir");
    return false;
  }
  var data = dataChannelSend.value;
  console.log(dataChannelSend)
  sendChannel.send(data);
  console.log('Sent Data: ' + data);
}

// create offer oferece criar a conversa, e createAnswer retorna se aceitou ou não
function gotDescription1(desc) {
  localConnection.setLocalDescription(desc);
  console.log('Offer from localConnection \n' + desc.sdp);
  remoteConnection.setRemoteDescription(desc);
  remoteConnection.createAnswer().then(
      gotDescription2,
      onCreateSessionDescriptionError
  );
}
// descricao do contato remoto
function gotDescription2(desc) {
  remoteConnection.setLocalDescription(desc);
  console.log('Answer from remoteConnection \n' + desc.sdp);
  localConnection.setRemoteDescription(desc).then().catch();
}
// cria o candidato remoto
function iceCallback1(event) {
  console.log('local ice callback');
  if (event.candidate) {
    remoteConnection.addIceCandidate(
        event.candidate
    ).then(
        onAddIceCandidateSuccess,
        onAddIceCandidateError
    );
    console.log('Local ICE candidate: \n' + event.candidate.candidate);
  }
}
// cria o candidato local
function iceCallback2(event) {
  console.log('remote ice callback');
  if (event.candidate) {
    localConnection.addIceCandidate(
        event.candidate
    ).then(
        onAddIceCandidateSuccess,
        onAddIceCandidateError
    );
    console.log('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
}

function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}
// fecha conexoes
function closeDataChannels() {
  dataChannelSend.disabled = true;
  console.log("fecha conexao")
  console.log('Closing data channels');
  sendChannel.close();
  console.log('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  console.log('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
}
//log
function onCreateSessionDescriptionError(error) {
  console.log('Failed to create session description: ' + error.toString());
}
//log
function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}
//log
function onAddIceCandidateError(error) {
  console.log('Failed to add Ice Candidate: ' + error.toString());
}


function onReceiveMessageCallback(event) {
  console.log('Received Message');
  console.log(event)
  dataChannelReceive.value = event.data;
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  console.log('Receive channel state is: ' + readyState);
}
