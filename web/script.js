const SERVER_URL = 'http://localhost:5000';

const capturePhotoButton = document.querySelector("#click-photo");
const canvas = document.querySelector("#canvas");
const video = document.querySelector("#video");
const videoContainer = document.getElementById('video-container');
const canvasContainer = document.getElementById('canvas-container');
const registrationSuccessInfo = document.getElementById('success');
const registrationFailedInfo = document.getElementById('error');
const cardInfoText = document.getElementById('info-text');
const cardErrorText = document.getElementById('error-text');
const registerButton = document.getElementById('register');
let currentCardId = null;
let stream;

capturePhotoButton.addEventListener('click', function () {
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    videoContainer.style.display = 'none';
    canvasContainer.style.display = 'flex';
    stream.getTracks().forEach(function (track) {
        track.stop();
    });
    const imageDataUrl = canvas.toDataURL('image/jpeg').split(',')[1];
    if (currentCardId) {

        fetch(`${SERVER_URL}/encode?card_id=${currentCardId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageDataUrl
            })
        }).then(
            (response) => {
                response.json().then((data) => {
                    if (data) {
                        if (data.status === '0') {
                            canvasContainer.style.display = 'none';
                            registerButton.disabled = false;
                            registrationSuccessInfo.style.display = 'block';
                            registerButton.style.display = 'block';
                            setTimeout(() => {
                                registrationSuccessInfo.style.display = 'none';
                            }, 5000)
                        } else {
                            handleImageRegistrationError();
                        }
                    } else {
                        handleImageRegistrationError();
                    }
                });
            },
            (error) => {
                handleImageRegistrationError();
                console.log(error);
            }
        );
    }
});

const handleImageRegistrationError = () => {
    registrationFailedInfo.style.display = 'block';
    setTimeout(() => {
        registrationFailedInfo.style.display = 'none';
    }, 5000)
    turnCameraOn();
}

const register = () => {
    registerButton.style.display = 'none';
    cardInfoText.style.display = 'block';
    cardErrorText.style.display = 'none';
    registerButton.disabled = true;
    fetch(`${SERVER_URL}/id`, {
        method: 'GET',
    }).then((response) => {
        cardInfoText.style.display = 'none';
        response.json().then((data) => {
            if (data) {
                currentCardId = data['card_id'];
                hideInfo();
                turnCameraOn();
            } else {
                handleRegisterError(data)
            }
        });
    }, (error) => {
        handleRegisterError(error);
    });
};

const handleRegisterError = (error) => {
    cardInfoText.style.display = 'none';
    registerButton.disabled = false;
    registerButton.style.display = 'block';
    cardErrorText.style.display = 'block';
    currentCardId = null;
    console.log(error);
}

const hideInfo = () => {
    cardInfoText.style.display = 'none';
    cardErrorText.style.display = 'none';
}

async function turnCameraOn() {
    stream = await navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: {
                exact: '58786cd967d5abcc87859a5fca02b875e6582bf8862859db4a718b6b23193bd1'
            },
        }, audio: false,
    });
    video.srcObject = stream;
    if (stream) {
        videoContainer.style.display = 'flex';
        canvasContainer.style.display = 'none';
    }
}