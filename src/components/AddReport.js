import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaMicrophone } from "react-icons/fa";
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
  const [materialPhotos, setMaterialPhotos] = useState([]);
  const [reasonPhotos, setReasonPhotos] = useState([]);
  const [activeListeningField, setActiveListeningField] = useState(null);
  const navigate = useNavigate();
  const [manufacturer, setManufacturer] = useState("에스티엘");
  const [customManufacturer, setCustomManufacturer] = useState("");

  const fileInputRef = useRef();
  
  // Speech-to-Text configuration
  const { transcript, resetTranscript } = useSpeechRecognition({
    clearTranscriptOnListen: true
  });

  // Handler for toggling mic for specific field
  const handleSTT = (fieldSetter, fieldName) => {
    if (activeListeningField === fieldName) {
      // If already listening to this field, stop
      SpeechRecognition.stopListening();
      fieldSetter(transcript); // Only set transcript, do not append
      resetTranscript();
      setActiveListeningField(null);
    } else {
      // If listening to another field or not listening
      if (activeListeningField) {
        // Stop previous listening
        SpeechRecognition.stopListening();
        resetTranscript();
      }
      
      // Start listening for new field
      SpeechRecognition.startListening({ language: "ko-KR", continuous: true });
      setActiveListeningField(fieldName);
    }
  };

  // Helper function to get the appropriate setter based on field name
  const getFieldSetter = (fieldName) => {
    switch (fieldName) {
      case "detailedAddress": return setDetailedAddress;
      case "company": return setCompany;
      case "recycleCategory": return setRecycleCategory;
      case "malfunctionDetails": return setMalfunctionDetails;
      case "actionDetails": return setActionDetails;
      case "malfunctionReason": return setMalfunctionReason;
      case "writer": return setWriter;
      default: return () => {};
    }
  };

  // Update the field with transcript while listening
  React.useEffect(() => {
    if (activeListeningField) {
      const fieldSetter = getFieldSetter(activeListeningField);
      fieldSetter(transcript);
    }
  }, [transcript, activeListeningField]);

// Function to upload files to Firebase Storage
const uploadFiles = async (files, folder) => {
  const promises = files.map((file) => {
    const storageRef = ref(storage, `${folder}/${file.name}`);
    return uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef));
  });
  return Promise.all(promises);
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

    {/* Detailed Address */}
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
          onClick={() => handleSTT(setDetailedAddress, "detailedAddress")}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            color: activeListeningField === "detailedAddress" ? "red" : "black",
          }}
        />
      </div>
    </div>

    {/* Writer */}
    <div>
      <label>작성자:</label>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type="text"
          value={writer}
          onChange={(e) => setWriter(e.target.value)}
          placeholder="작성자 이름 입력"
        />
        <FaMicrophone
          onClick={() => handleSTT(setWriter, "writer")}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            color: activeListeningField === "writer" ? "red" : "black",
          }}
        />
      </div>
    </div>

    {/* Phone Number */}
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

    {/* Report Date */}
    <div>
      <label>작성일:</label>
      <DatePicker
        selected={reportDate}
        onChange={(date) => setReportDate(date)}
        dateFormat="yyyy-MM-dd"
      />
    </div>

    {/* Company */}
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
          onClick={() => handleSTT(setCompany, "company")}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            color: activeListeningField === "company" ? "red" : "black",
          }}
        />
      </div>
    </div>

    {/* Recycle Category */}
    <div>
      <label>제품 종류:</label>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type="text"
          value={recycleCategory}
          onChange={(e) => setRecycleCategory(e.target.value)}
          placeholder=" 제품 종류를 입력하세요"
        />
        <FaMicrophone
          onClick={() => handleSTT(setRecycleCategory, "recycleCategory")}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            color: activeListeningField === "recycleCategory" ? "red" : "black",
          }}
        />
      </div>
    </div>

    {/* Malfunction Details */}
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
          onClick={() => handleSTT(setMalfunctionDetails, "malfunctionDetails")}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            color: activeListeningField === "malfunctionDetails" ? "red" : "black",
          }}
        />
      </div>
    </div>

    {/* Action Details */}
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
          onClick={() => handleSTT(setActionDetails, "actionDetails")}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            color: activeListeningField === "actionDetails" ? "red" : "black",
          }}
        />
      </div>
    </div>

    {/* Malfunction Reason */}
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
          onClick={() => handleSTT(setMalfunctionReason, "malfunctionReason")}
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            color: activeListeningField === "malfunctionReason" ? "red" : "black",
          }}
        />
      </div>
    </div>

    {/* Manufacturer */}
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

    {/* Field Photos */}
    <div>
      <label>현장 사진 업로드:</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setFieldPhotos(Array.from(e.target.files))}
      />
    </div>

    {/* Reason Photos */}
    <div>
      <label>원인 사진 업로드:</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setReasonPhotos(Array.from(e.target.files))}
      />
    </div>

    {/* Material Photos
    <div>
      <label>원료 사진 업로드:</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setMaterialPhotos(Array.from(e.target.files))}
      />
    </div> */}

    <button type="submit">제출</button>
  </form>
);
};

export default AddReport;