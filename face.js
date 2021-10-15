// make this a global var so that we don't have to fetch it asyncronously elsewhere
var headTilt

const findAverageKey = (arr, key) => {
	const { length } = arr;
	return arr.reduce((acc, val) => {
		return acc + (val[key]/length);
	}, 0);
};

const findVarianceKey = (arr, key, avg) => {
	const { length } = arr;
	return arr.reduce((acc, val) => {
		return acc + (((val[key] - avg)**2)/length);
	}, 0);
};

async function getHeadTilt() {
	const videoEl = $('#inputVideo').get(0)

	const options = new faceapi.SsdMobilenetv1Options({ minconfidence: 0.5 })
	const result = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks()

	if (result) {
		// estimation of head tilt in x and y axis
		const landmarks = result.landmarks
		const shift = result.landmarks.shift
		const jawOutline = landmarks.getJawOutline()
		const leftEye = landmarks.getLeftEye()
		const rightEye = landmarks.getRightEye()
		const mouth = landmarks.getMouth()


		// This method doesn't account for scaling
		// (i.e. how close a face is to the camera)
		var avgFace = { "x": findAverageKey(landmarks.positions, "_x"), "y": findAverageKey(landmarks.positions, "_y")}
		var avgJaw = { "x": findAverageKey(jawOutline, "_x"), "y": findAverageKey(jawOutline, "_y")}
		var avgLeftEye = { "x": findAverageKey(leftEye, "_x"), "y": findAverageKey(leftEye, "_y")}
		var avgRightEye = { "x": findAverageKey(rightEye, "_x"), "y": findAverageKey(rightEye, "_y")}
		var avgMouth = { "x": findAverageKey(mouth, "_x"), "y": findAverageKey(mouth, "_y")}
		var deviationMouth = { "x": Math.sqrt(findVarianceKey(mouth, "_x", avgMouth["x"])), "y": Math.sqrt(findVarianceKey(mouth, "_y", avgMouth["y"]))}

		var tiltX = avgJaw["x"] - avgFace["x"]
		var tiltY = avgJaw["y"] - avgFace["y"] - 20
		var tiltZ = Math.atan((avgLeftEye["y"] - avgRightEye["y"])/(avgLeftEye["x"] - avgRightEye["x"]))
		// This is a bad method that will make it so that the mouth is "open" when it is only tilted
		var mouthOpenY = (deviationMouth["y"]/deviationMouth["x"])

		return({"_x": tiltX, "_y": tiltY, "_z": tiltZ, "mouthOpenY": mouthOpenY})
	}
}


async function onPlay() {
	headTilt = await getHeadTilt()

	setTimeout(() => onPlay())
}

async function run() {
	await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
	await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
	console.log("ssdMobilenetv1 loaded")

	const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
	const videoEl = $('#inputVideo').get(0)
	videoEl.srcObject = stream
	console.log("video object has stream")
}

function updateResults() {}

$(document).ready(function() {
	run()
})