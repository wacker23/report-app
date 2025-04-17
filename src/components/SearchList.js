import React, { useEffect, useState } from "react";
import { db, storage } from "./DB";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import "../styles/SearchList.css";
import { downloadReportAsPdf } from "./DownloadPdf";
import { FaMicrophone, FaCamera } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SearchList = () => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterField, setFilterField] = useState("address");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch documents from Firestore
  useEffect(() => {
    const fetchDocuments = async () => {
      const querySnapshot = await getDocs(collection(db, "asAddress"));
      const fetchedDocuments = [];
      querySnapshot.forEach((doc) => {
        fetchedDocuments.push({ id: doc.id, ...doc.data() });
      });
      setDocuments(fetchedDocuments);
    };
    fetchDocuments();
  }, []);

  // Filtered documents based on search query
  const filteredDocuments = documents.filter((doc) => {
    const filterValue =
      filterField === "address"
        ? `${doc.address} ${doc.detailedAddress}`
        : doc[filterField];
    return filterValue.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle selecting a document to view/edit
  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc);
    setFormData(doc);
    setIsEditing(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle saving changes to Firestore
  const saveEdits = async () => {
    try {
      await updateDoc(doc(db, "asAddress", formData.id), formData);
      alert("Document successfully updated!");
      setDocuments((prevDocuments) =>
        prevDocuments.map((item) =>
          item.id === formData.id ? { ...item, ...formData } : item
        )
      );
      setSelectedDocument(null);
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Failed to update document.");
    }
  };

  // Handle deleting a document
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDoc(doc(db, "asAddress", selectedDocument.id));
        alert("Document successfully deleted!");
        setDocuments((prevDocuments) =>
          prevDocuments.filter((doc) => doc.id !== selectedDocument.id)
        );
        setSelectedDocument(null);
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Failed to delete document.");
      }
    }
  };

  // Handle file uploads
  const handleFileUpload = async (e, fieldName) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadedURLs = await Promise.all(
        files.map(async (file) => {
          const storageRef = ref(storage, `${fieldName}/${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      setFormData((prevFormData) => ({
        ...prevFormData,
        photos: {
          ...prevFormData.photos,
          [fieldName]: [...(prevFormData.photos?.[fieldName] || []), ...uploadedURLs],
        },
      }));
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files.");
    } finally {
      setUploading(false);
    }
  };

  // Handle deleting a photo
  const handleDeletePhoto = async (photoURL, fieldName) => {
    if (window.confirm("Are you sure you want to delete this photo?")) {
      try {
        const photoRef = ref(storage, photoURL);
        await deleteObject(photoRef);
        setFormData((prevFormData) => ({
          ...prevFormData,
          photos: {
            ...prevFormData.photos,
            [fieldName]: prevFormData.photos[fieldName].filter((url) => url !== photoURL),
          },
        }));
        alert("Photo successfully deleted!");
      } catch (error) {
        console.error("Error deleting photo:", error);
        alert("Failed to delete photo.");
      }
    }
  };

  return (
    <div className="content-container">
      <h2>Report List</h2>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select onChange={(e) => setFilterField(e.target.value)}>
          <option value="address">주소</option>
          <option value="reportDate">작성일</option>
          <option value="recycleCategory">재활용 분류</option>
        </select>
      </div>

      {/* Conditionally render either the list or the detailed view */}
      {selectedDocument ? (
        <div className="document-detail">
          <h3>{isEditing ? "Edit Report" : "Report Details"}</h3>
          {!isEditing ? (
            <div>
              {/* Report Details */}
              <p>
                <strong>주소:</strong> {selectedDocument.address}
              </p>
              <p>
                <strong>상세 주소:</strong> {selectedDocument.detailedAddress}
              </p>
              <p>
                <strong>작성자:</strong> {selectedDocument.writer}
              </p>
              <p>
                <strong>전화번호:</strong> {selectedDocument.phoneNumber}
              </p>
              <p>
                <strong>작성일:</strong>{" "}
                {new Date(selectedDocument.reportDate).toLocaleString()}
              </p>
              <p>
                <strong>의뢰업체:</strong> {selectedDocument.company}
              </p>
              <p>
                <strong>재활용 분류:</strong> {selectedDocument.recycleCategory}
              </p>
              
              <p>
                <strong>장애 내용:</strong> {selectedDocument.malfunctionDetails}
              </p>
              <p>
                <strong>장애 조치:</strong> {selectedDocument.actionDetails}
              </p>
              <p>
                <strong>장애 판명:</strong> {selectedDocument.malfunctionReason}
              </p>
              <p>
                <strong>제조업체명:</strong> {selectedDocument.manufacturer}
              </p>
              

              {/* Field Photos */}
              <h4>현장 Photos</h4>
              {selectedDocument.photos?.fieldPhotoURLs?.length > 0 ? (
                <div className="photo-gallery">
                  {selectedDocument.photos.fieldPhotoURLs.map((photoURL, index) => (
                    <div key={index} className="photo-item">
                      <a
                        href={photoURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={photoURL}
                          alt={`Field Photo ${index + 1}`}
                          className="photo-thumbnail"
                        />
                      </a>
                      {isEditing && (
                        <button
                          onClick={() => handleDeletePhoto(photoURL, "fieldPhotoURLs")}
                          className="delete-photo-button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No Field Photos</p>
              )}


            <h4>이유 Photos</h4>
              {selectedDocument.photos?.reasonPhotoURLs?.length > 0 ? (
                <div className="photo-gallery">
                  {selectedDocument.photos.reasonPhotoURLs.map((photoURL, index) => (
                    <div key={index} className="photo-item">
                      <a
                        href={photoURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={photoURL}
                          alt={`Field Photo ${index + 1}`}
                          className="photo-thumbnail"
                        />
                      </a>
                      {isEditing && (
                        <button
                          onClick={() => handleDeletePhoto(photoURL, "reasonPhotoURLs")}
                          className="delete-photo-button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No Field Photos</p>
              )}



              {/* Material Photos */}
              <h4>원료 Photos</h4>
              {selectedDocument.photos?.materialPhotoURLs?.length > 0 ? (
                <div className="photo-gallery">
                  {selectedDocument.photos.materialPhotoURLs.map((photoURL, index) => (
                    <div key={index} className="photo-item">
                      <a
                        href={photoURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={photoURL}
                          alt={`Material Photo ${index + 1}`}
                          className="photo-thumbnail"
                        />
                      </a>
                      {isEditing && (
                        <button
                          onClick={() => handleDeletePhoto(photoURL, "materialPhotoURLs")}
                          className="delete-photo-button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No Material Photos</p>
              )}

              {/* Buttons */}
              <button onClick={() => setIsEditing(true)}>Edit</button>
              <button onClick={handleDelete} style={{ backgroundColor: "red", color: "white" }}>
                Delete
              </button>
              <button onClick={() => downloadReportAsPdf(selectedDocument)}>
                Download as PDF
              </button>
              <button onClick={() => setSelectedDocument(null)}>Back</button>
            </div>
          ) : (
            <form>
              {/* Editable Form */}
              <div>
                <label>주소:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>상세 주소:</label>
                <input
                  type="text"
                  name="detailedAddress"
                  value={formData.detailedAddress || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>작성자:</label>
                <input
                  type="text"
                  name="writer"
                  value={formData.writer || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>전화번호:</label>
                <select
                  name="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={handleInputChange}
                >
                  <option value="010 7421 1684">010 7421 1684</option>
                  <option value="없음">없음</option>
                  <option value="기타">기타</option>
                </select>
                {formData.phoneNumber === "기타" && (
                  <input
                    type="text"
                    name="customPhoneNumber"
                    value={formData.customPhoneNumber || ""}
                    onChange={handleInputChange}
                    placeholder="전화번호 입력"
                  />
                )}
              </div>
              <div>
                <label>작성일:</label>
                <DatePicker
                  selected={formData.reportDate ? new Date(formData.reportDate) : new Date()}
                  onChange={(date) => setFormData({ ...formData, reportDate: date })}
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div>
                <label>의뢰업체:</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>재활용 분류:</label>
                <input
                  type="text"
                  name="recycleCategory"
                  value={formData.recycleCategory || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>장애 내용:</label>
                <input
                  type="text"
                  name="malfunctionDetails"
                  value={formData.malfunctionDetails || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>장애 조치:</label>
                <input
                  type="text"
                  name="actionDetails"
                  value={formData.actionDetails || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>장애 판명:</label>
                <input
                  type="text"
                  name="malfunctionReason"
                  value={formData.malfunctionReason || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>제조업체명:</label>
                <select
                  name="manufacturer"
                  value={formData.manufacturer || ""}
                  onChange={handleInputChange}
                >
                  <option value="에스티엘">에스티엘</option>
                  <option value="기타">기타</option>
                </select>
                {formData.manufacturer === "기타" && (
                  <input
                    type="text"
                    name="customManufacturer"
                    value={formData.customManufacturer || ""}
                    onChange={handleInputChange}
                    placeholder="제조업체명 입력"
                  />
                )}
              </div>
              
              

              {/* Upload Field Photos */}
              <div>
                <label>Upload Field Photos:</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, "fieldPhotoURLs")}
                  disabled={uploading}
                />
              </div>


              {/* Upload Field Photos */}
              <div>
                <label>Upload resion Photos:</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, "reasonPhotoURLs")}
                  disabled={uploading}
                />
              </div>

              {/* Upload Material Photos */}
              <div>
                <label>Upload Material Photos:</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, "materialPhotoURLs")}
                  disabled={uploading}
                />
              </div>

              <button type="button" onClick={saveEdits}>
                Save
              </button>
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </form>
          )}
        </div>
      ) : (
        <ul className="document-list">
          {filteredDocuments.map((doc) => (
            <li
              key={doc.id}
              className="document-item"
              onClick={() => handleDocumentClick(doc)}
            >
              <div>
                <strong>주소:</strong> {doc.address} {doc.detailedAddress}
              </div>
              <div>
                <strong>작성일:</strong>{" "}
                {new Date(doc.reportDate).toLocaleString()}
              </div>
              <div>
                <strong>재활용 분류:</strong> {doc.recycleCategory}
              </div>
              <div>
                <strong>작성자:</strong> {doc.writer}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchList;