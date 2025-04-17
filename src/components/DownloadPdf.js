import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { jsPDF } from "jspdf";
import NanumGothicFontBase64 from "./NanumGothic-Regular-normal";
import logo from "../styles/logo.png"; // Import logo

const getImageURL = async (imagePath) => {
  const storage = getStorage();
  const imageRef = ref(storage, imagePath);

  try {
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (error) {
    console.error("Error getting image URL from Firestore: ", error);
    return null;
  }
};

export const downloadReportAsPdf = async (reportData) => {
  try {
    if (!reportData) {
      throw new Error("No report data provided.");
    }

    const doc = new jsPDF("p", "mm", "a4");

    // Set Korean font
    doc.addFileToVFS("NanumGothic.ttf", NanumGothicFontBase64);
    doc.addFont("NanumGothic.ttf", "NanumGothic", "normal");
    doc.setFont("NanumGothic");

    // Add header (logo + title)
    doc.addImage(logo, "PNG", 10, 10, 30, 15); // Logo at top left
    doc.setFontSize(18);
    doc.setFont("NanumGothic", "normal");
    doc.text("장애리포트", 90, 20); // Title centered

    doc.setFontSize(12);
    doc.setFont("NanumGothic", "normal");

    // Define the maximum width for text (A4 width is 210mm, leaving margins)
    const maxWidth = 190; // 210mm - 10mm (left margin) - 10mm (right margin)

    // Function to add text with automatic line breaks
    const addTextWithLineBreaks = (text, x, y) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * 10; // Return the height used (10mm per line)
    };

    // Report details
    let yOffset = 40;
    yOffset += addTextWithLineBreaks(`주소: ${reportData.address} ${reportData.detailedAddress}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`작성일: ${new Date(reportData.reportDate).toLocaleString()}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`작성자: ${reportData.writer}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`전화번호: ${reportData.phoneNumber}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`의뢰업체: ${reportData.company}`, 10, yOffset);
    
    
    yOffset += addTextWithLineBreaks(`제품 공류: ${reportData.recycleCategory}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`장애 내용: ${reportData.malfunctionDetails}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`장애 조치: ${reportData.actionDetails}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`장애 판명: ${reportData.malfunctionReason}`, 10, yOffset);
    yOffset += addTextWithLineBreaks(`제조업체명: ${reportData.manufacturer}`, 10, yOffset);

    

    yOffset += 20; // Increased space before "현장 Photos:"

    // Define image size and spacing
    const imgWidth = 50;
    const imgHeight = 50;
    const imgSpacing = 10;
    const maxImagesPerRow = 3;

    // Add Field Photos
    if (reportData.photos?.fieldPhotoURLs?.length > 0) {
      doc.text("현장 Photos:", 10, yOffset);
      yOffset += 15; // More space after title

      let xOffset = 10;

      for (let i = 0; i < reportData.photos.fieldPhotoURLs.length; i++) {
        try {
          const imageUrl = await getImageURL(reportData.photos.fieldPhotoURLs[i]);
          if (imageUrl) {
            const img = await loadImage(imageUrl);

            if (xOffset + imgWidth > doc.internal.pageSize.getWidth()) {
              xOffset = 10;
              yOffset += imgHeight + imgSpacing;
            }

            if (yOffset + imgHeight > doc.internal.pageSize.getHeight()) {
              doc.addPage();
              yOffset = 10;
            }

            doc.addImage(img, "JPEG", xOffset, yOffset, imgWidth, imgHeight);
            xOffset += imgWidth + imgSpacing;
          }
        } catch (error) {
          console.error("Error adding field photo:", error);
        }
      }

      yOffset += imgHeight + imgSpacing;
    }

    // Add Field Photos
    if (reportData.photos?.reasonPhotoURLs?.length > 0) {
      doc.text("이유유 Photos:", 10, yOffset);
      yOffset += 15; // More space after title

      let xOffset = 10;

      for (let i = 0; i < reportData.photos.reasonPhotoURLs.length; i++) {
        try {
          const imageUrl = await getImageURL(reportData.photos.reasonPhotoURLs[i]);
          if (imageUrl) {
            const img = await loadImage(imageUrl);

            if (xOffset + imgWidth > doc.internal.pageSize.getWidth()) {
              xOffset = 10;
              yOffset += imgHeight + imgSpacing;
            }

            if (yOffset + imgHeight > doc.internal.pageSize.getHeight()) {
              doc.addPage();
              yOffset = 10;
            }

            doc.addImage(img, "JPEG", xOffset, yOffset, imgWidth, imgHeight);
            xOffset += imgWidth + imgSpacing;
          }
        } catch (error) {
          console.error("Error adding field photo:", error);
        }
      }

      yOffset += imgHeight + imgSpacing;
    }

    // Add Material Photos
    if (reportData.photos?.materialPhotoURLs?.length > 0) {
      doc.text("원료 Photos:", 10, yOffset);
      yOffset += 15;

      let xOffset = 10;

      for (let i = 0; i < reportData.photos.materialPhotoURLs.length; i++) {
        try {
          const imageUrl = await getImageURL(reportData.photos.materialPhotoURLs[i]);
          if (imageUrl) {
            const img = await loadImage(imageUrl);

            if (xOffset + imgWidth > doc.internal.pageSize.getWidth()) {
              xOffset = 10;
              yOffset += imgHeight + imgSpacing;
            }

            if (yOffset + imgHeight > doc.internal.pageSize.getHeight()) {
              doc.addPage();
              yOffset = 10;
            }

            doc.addImage(img, "JPEG", xOffset, yOffset, imgWidth, imgHeight);
            xOffset += imgWidth + imgSpacing;
          }
        } catch (error) {
          console.error("Error adding material photo:", error);
        }
      }
    }

    // Save the PDF
    doc.save(`report_${reportData.id}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please check the console for details.");
  }
};

// Helper function to load images
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      console.error("Error loading image:", error);
      reject(new Error(`Failed to load image: ${url}`));
    };
  });
};