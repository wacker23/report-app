import React, { useEffect, useState } from "react";
import { db } from "./DB"; // Import the Firestore instance
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import "../styles/List.css"; // Add your styles for UI

const List = ({ address }) => {
  const [documents, setDocuments] = useState([]); // Store documents retrieved from Firestore
  const [selectedDocument, setSelectedDocument] = useState(null); // Store the selected document to edit/view
  const [formData, setFormData] = useState({}); // Form state for editing
  const [isEditing, setIsEditing] = useState(false); // Track editing status

  // Fetch documents from Firestore
  useEffect(() => {
    const fetchDocuments = async () => {
      const querySnapshot = await getDocs(collection(db, "asAddress"));
      const fetchedDocuments = [];
      querySnapshot.forEach((doc) => {
        fetchedDocuments.push({ id: doc.id, ...doc.data() });
      });

      // Filter documents based on the passed address
      const filteredDocuments = fetchedDocuments.filter((doc) =>
        `${doc.address} ${doc.detailedAddress}`.includes(address)
      );

      setDocuments(filteredDocuments);
    };

    fetchDocuments();
  }, [address]); // Re-fetch documents when the address prop changes

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

  return (
    <div className="content-container">
      <h2>List</h2>

      {/* Conditionally render either the list or the detailed view */}
      {selectedDocument ? (
        <div className="document-detail">
          <h3>{isEditing ? "Edit Document" : "Document Details"}</h3>
          {!isEditing ? (
            <div>
              {/* Document Details */}
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

              {/* Buttons */}
              <button onClick={() => setIsEditing(true)}>Edit</button>
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
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>작성일:</label>
                <input
                  type="text"
                  name="reportDate"
                  value={formData.reportDate || ""}
                  onChange={handleInputChange}
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
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer || ""}
                  onChange={handleInputChange}
                />
              </div>

              {/* Save and Cancel Buttons */}
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
          {documents.map((doc) => (
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

export default List;