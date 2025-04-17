
import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaMicrophone, FaCamera } from "react-icons/fa";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db, storage } from "./DB";
import "../styles/AddReport.css";
import { useNavigate } from "react-router-dom";

const AddReport = () => {
  const location = useLocation();
  const passedAddress = location?.state?.address || "주소 정보 없음";

  // Form state fields
  const [detailedAddress, setDetailedAddress] = useState("");
  const [writer, setWriter] = useState("");
  const [reportDate, setReportDate] = useState(new Date());
  const [company, setCompany] = useState("");
  const [malfunctionDetails, setMalfunctionDetails] = useState("");
  const [actionDetails, setActionDetails] = useState("");
  const [malfunctionReason, setMalfunctionReason] = useState("");
  const [recycleCategory, setRecycleCategory] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("010 7421 1684");
  const [customPhoneNumber, setCustomPhoneNumber] = useState("");
  const [fieldPhotos, setFieldPhotos] = useState([]);
  const [materialPhotos, setMaterialPhotos] = useState([]); // NEW: Material photos
  const [reasonPhotos, setReasonPhotos] = useState([]);
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();
  const [manufacturer, setManufacturer] = useState("");
const [customManufacturer, setCustomManufacturer] = useState("");

  const fileInputRef = useRef();
  // Speech-to-Text configuration
  const { transcript, resetTranscript } = useSpeechRecognition();




  const [capturedPhoto, setCapturedPhoto] = useState(null); // For storing the captured image
  const [isCameraOpen, setIsCameraOpen] = useState(false); // Controls whether the camera is open

  const openCamera = async () => {
    try {
      // Request access to the user's camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // Display the camera feed in a video element
      const videoElement = document.getElementById("cameraFeed");
      videoElement.srcObject = stream;
      videoElement.play();

      setIsCameraOpen(true);
    } catch (error) {
      console.error("Error accessing the camera:", error);
      alert("카메라에 접근할 수 없습니다.");
    }
  };

  const capturePhoto = () => {
    const videoElement = document.getElementById("cameraFeed");
    const canvasElement = document.createElement("canvas"); // Create a canvas
    const context = canvasElement.getContext("2d");

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Convert the canvas image to a data URL (base64-encoded)
    const photo = canvasElement.toDataURL("image/png");
    setCapturedPhoto(photo);

    // Stop the camera stream
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());

    setIsCameraOpen(false);
  };







  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    alert("이 브라우저는 음성인식을 지원하지 않습니다.");
  }

  // Handler for toggling mic (on/off)
  const handleSTT = (fieldSetter) => {
    if (listening) {
      SpeechRecognition.stopListening();
      fieldSetter((prev) => prev + transcript); // Append dictated text to existing value
      resetTranscript();
      setListening(false);
    } else {
      SpeechRecognition.startListening({ language: "ko-KR" });
      setListening(true);
    }
  };

  // File upload handler
  const handleFileSelection = (setter) => (e) => {
    setter(Array.from(e.target.files));
  };

// Function to upload files to Firebase Storage
const uploadFiles = async (files, folder) => {
  const promises = files.map((file) => {
    const storageRef = ref(storage, `${folder}/${file.name}`);
    return uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef));
  });
  return Promise.all(promises);
};

// Camera capture feature
const handleTakePhoto = () => {
  // Trigger the file input for capturing photos from a camera
  fileInputRef.current.click();
};

// Form submission handler
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const fieldPhotoURLs = await uploadFiles(fieldPhotos, "fieldPhotos");
    const materialPhotoURLs = await uploadFiles(materialPhotos, "materialPhotos");
    const reasonPhotoURLs = await uploadFiles(reasonPhotos, "reasonPhotos");

    const reportData = {
      address: passedAddress,
      detailedAddress,
      writer,
      reportDate: reportDate.toISOString(),
      company,
      malfunctionDetails,
      actionDetails,
      malfunctionReason,
      manufacturer: manufacturer === "기타" ? customManufacturer : manufacturer,
      recycleCategory,
      phoneNumber: phoneNumber === "기타" ? customPhoneNumber : phoneNumber,
      photos: {
        fieldPhotoURLs,
        materialPhotoURLs,
        reasonPhotoURLs, // Include reason photo URLs
      },
      createdAt: new Date(),
    };

    await addDoc(collection(db, "asAddress"), reportData);
    alert("AS 보고서가 성공적으로 제출되었습니다!");
    navigate("/dashboard");
  } catch (error) {
    console.error("Error submitting report:", error);
    alert("Error: 보고서를 제출하는 중 문제가 발생했습니다.");
  }
};

  return (
    <form onSubmit={handleSubmit}>
      <h2>AS 장애 보고</h2>

      {/* Address Holder */}
      <div style={{ marginBottom: "20px" }}>
        <label>주소:</label>
        <p style={{
          backgroundColor: "#f9f9f9",
          padding: "10px 1px",
          borderRadius: "6px",
          border: "1px solid #dee2e6",
          fontSize: "14px"
        }}>
          {passedAddress}
        </p>
      </div>

      <div>
        <label>상세주소:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            value={detailedAddress}
            onChange={(e) => setDetailedAddress(e.target.value)}
            placeholder="상세 주소를 입력하세요"
          />
          <FaMicrophone
            onClick={() => handleSTT(setDetailedAddress)}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              color: listening ? "red" : "black", // Active mic indicator
            }}
          />
        </div>
      </div>

      <div>
        <label>작성자:</label>
        <input
          type="text"
          value={writer}
          onChange={(e) => setWriter(e.target.value)}
          placeholder="작성자 이름 입력"
        />
      </div>
      <div>
        <label>전화번호:</label>
        <select
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        >
          <option value="010 7421 1684">010 7421 1684</option>
          <option value="없음">없음</option>
          <option value="기타">기타</option>
        </select>
        {phoneNumber === "기타" && (
          <input
            type="text"
            value={customPhoneNumber}
            onChange={(e) => setCustomPhoneNumber(e.target.value)}
            placeholder="전화번호 입력"
          />
        )}
      </div>

      <div>
        <label>작성일:</label>
        <DatePicker
          selected={reportDate}
          onChange={(date) => setReportDate(date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <div>
        <label>의뢰업체:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="의뢰업체 입력"
          />
          <FaMicrophone
            onClick={() => handleSTT(setCompany)}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              color: listening ? "red" : "black",
            }}
          />
        </div>
      </div>

      <div>
        <label>제품 공류:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            value={recycleCategory}
            onChange={(e) => setRecycleCategory(e.target.value)}
            placeholder="재툼 공류를 입력하세요"
          />
          <FaMicrophone
            onClick={() => handleSTT(setRecycleCategory)}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              color: listening ? "red" : "black",
            }}
          />
        </div>
      </div>

      <div>
        <label>장애 내용:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            value={malfunctionDetails}
            onChange={(e) => setMalfunctionDetails(e.target.value)}
            placeholder="장애 내용을 입력하세요"
          />
          <FaMicrophone
            onClick={() => handleSTT(setMalfunctionDetails)}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              color: listening ? "red" : "black",
            }}
          />
        </div>
      </div>

      <div>
        <label>장애 조치:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            value={actionDetails}
            onChange={(e) => setActionDetails(e.target.value)}
            placeholder="장애 조치를 입력하세요"
          />
          <FaMicrophone
            onClick={() => handleSTT(setActionDetails)}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              color: listening ? "red" : "black",
            }}
          />
        </div>
      </div>

      <div>
        <label>장애 판명:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            value={malfunctionReason}
            onChange={(e) => setMalfunctionReason(e.target.value)}
            placeholder="장애 판명을 입력하세요"
          />
          <FaMicrophone
            onClick={() => handleSTT(setMalfunctionReason)}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              color: listening ? "red" : "black",
            }}
          />
        </div>
      </div>

            <div>
        <label>제조업체명:</label>
        <select
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
        >
          <option value="에스티엘">에스티엘</option>
          <option value="기타">기타</option>
        </select>
        {manufacturer === "기타" && (
          <input
            type="text"
            value={customManufacturer}
            onChange={(e) => setCustomManufacturer(e.target.value)}
            placeholder="제조업체명 입력"
          />
        )}
      </div>

      <div>
        <label>현장 사진 업로드:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFieldPhotos(Array.from(e.target.files))}
            />
            <FaCamera
              onClick={openCamera}
              style={{
                marginLeft: "10px",
                cursor: "pointer",
                fontSize: "20px",
                color: "#333",
              }}
            />
          </div>
      </div>


      <div>
      <label>이유 사진 업로드:</label>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setReasonPhotos(Array.from(e.target.files))}
        />
        <FaCamera
          onClick={openCamera}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            fontSize: "20px",
            color: "#333",
          }}
        />
      </div>
    </div>

 {/* New Section: 원료 사진 업로드 */}
 <div>
 <label>원료 사진 업로드:</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setMaterialPhotos(Array.from(e.target.files))}
            />
            <FaCamera
              onClick={openCamera}
              style={{
                marginLeft: "10px",
                cursor: "pointer",
                fontSize: "20px",
                color: "#333",
              }}
            />
          </div>
        </div>

      {/* Camera Feed */}
      {isCameraOpen && (
          <div style={{ marginBottom: "20px" }}>
            <video
              id="cameraFeed"
              style={{
                width: "100%",
                maxWidth: "300px",
                marginTop: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            ></video>
            <button type="button" onClick={capturePhoto} style={{ marginTop: "10px" }}>
              사진 촬영
            </button>
          </div>
        )}

        {/* Preview of Captured Photo */}
        {capturedPhoto && (
          <div style={{ marginBottom: "20px" }}>
            <h4>Captured Photo:</h4>
            <img
              src={capturedPhoto}
              alt="Captured"
              style={{ width: "100%", maxWidth: "300px", borderRadius: "6px" }}
            />
          </div>
        )}

      <button type="submit">제출</button>
    </form>
  );
};

export default AddReport;