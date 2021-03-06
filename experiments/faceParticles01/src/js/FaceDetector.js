import EventDispatcher from 'events'
import Config from './Config'

const MODEL_URL = './weights'
const inputSize = 224
const scoreThreshold = 0.5
const { faceapi } = window

function getCurrentFaceDetectionNet () {
  return faceapi.nets.tinyFaceDetector
}

function isFaceDetectionModelLoaded () {
  return !!getCurrentFaceDetectionNet().params
}

class FaceDetector extends EventDispatcher {
  constructor () {
    super()

    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      console.log('devices.length', devices.length)
      console.log('devices.length', devices.length)
      console.log('devices.length', devices.length)
      for (var i = 0; i < devices.length; i++) {
        var device = devices[i]
        if (device.kind === 'videoinput') {
          console.log(device.label, device.deviceId)
          // var option = document.createElement('option')
          // option.value = device.deviceId
          // option.text = device.label || 'camera ' + (i + 1)
          // document.querySelector('select#videoSource').appendChild(option)
        }
      };
    })

    this._hasModelLoaded = false
  }

  init () {
    this._initWebcam()
    this.startFaceDetection()
  }

  async _initWebcam () {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: '50e7be43db6b95d858f86ac7a0f2b64aa7b6e4c03900edc114b00752c063e82c' } })
    this._videoEl = document.querySelector('.webcamVideo')
    this._videoEl.srcObject = stream
  }

  async startFaceDetection () {
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL)
    await faceapi.loadFaceLandmarkModel(MODEL_URL)
    this._facedetectionOption = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })

    this.getFace()
  }

  async getFace () {
    const videoEl = document.querySelector('.webcamVideo')

    if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded()) {
      return setTimeout(() => this.getFace())
    }
    if (!this._hasModelLoaded) {
      this._hasModelLoaded = true
      setTimeout(() => {
        this.emit('loaded')
      }, 1500)
    }

    const result = await faceapi.detectSingleFace(this._videoEl, this._facedetectionOption).withFaceLandmarks()
    if (result) {
      const pointsMouth = result.landmarks.getMouth()
      const d = Math.abs(pointsMouth[14].y - pointsMouth[18].y)
      const mouthOpened = d > 20

      if (mouthOpened) {
        this.emit('mouthOpened')
      } else {
        this.emit('mouthClosed')
      }

      this.emit('resultMouth', pointsMouth)
      const points = result.landmarks.getNose().map(p => {
        return [(p.x - this.videoWidth / 2) * Config.faceDetectionScale, (p.y - this.videoHeight / 2) * Config.faceDetectionScale, 0]
      })
      this.emit('result', points)
    } else {
      this.emit('lost')
    }

    setTimeout(() => this.getFace())
  }

  get videoWidth () {
    return this._videoEl.videoWidth
  }

  get videoHeight () {
    return this._videoEl.videoHeight
  }
}

export default new FaceDetector()
