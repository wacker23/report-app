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

    // Professional header
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 30, "F");
    doc.addImage(logo, "PNG", 10, 7, 25, 15);
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("장애리포트", 105, 18, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    // Company info box
    doc.setDrawColor(25, 118, 210);
    doc.setLineWidth(0.5);
    doc.roundedRect(10, 35, 190, 40, 3, 3); // Increased height to accommodate address
    // Address (single line)
    doc.setFontSize(13);
    // 주소만 단독 라인에 표시
    doc.text(`주소: ${reportData.address} ${reportData.detailedAddress || ''}`, 15, 45);
    // 다음 줄부터 작성자, 작성일, 전화번호, 의뢰업체
    doc.text(`작성자: ${reportData.writer || '-'}`, 15, 53);
    doc.text(`작성일: ${new Date(reportData.reportDate).toLocaleDateString()}`, 120, 53);
    doc.text(`전화번호: ${reportData.phoneNumber || '-'}`, 15, 61);
    doc.text(`의뢰업체: ${reportData.company || '-'}`, 120, 61);

    // Section title with more space
    let yOffset = 95;
    doc.setFontSize(15);
    doc.setTextColor(25, 118, 210);
    doc.text("리포트 상세내용", 15, yOffset);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    yOffset += 7; // Less space between title and table

    // Details table - ensure proper Korean encoding
    const details = [
      ["제품 종류", reportData.recycleCategory || '-'],
      ["장애 내용", reportData.malfunctionDetails || '-'],
      ["장애 조치", reportData.actionDetails || '-'],
      ["장애 판명", reportData.malfunctionReason || '-'],
      ["제조업체명", reportData.manufacturer || '-']
    ];
    details.forEach(([label, value]) => {
      doc.setFont("NanumGothic", "normal");
      doc.text(`${label}:`, 15, yOffset);
      doc.setFont("NanumGothic", "normal");
      // Split long text into multiple lines
      const lines = doc.splitTextToSize(value, 150);
      doc.text(lines, 55, yOffset);
      // Adjust yOffset based on number of lines
      yOffset += Math.max(7, lines.length * 7); // Less space between rows
    });

    // Photos section
    yOffset += 10;
    doc.setFontSize(15);
    doc.setTextColor(25, 118, 210);
    doc.text("현장 사진", 15, yOffset);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    yOffset += 7;

    // Add Field Photos
    const imgWidth = 50, imgHeight = 50, imgSpacing = 7;
    let xOffset = 15;
    if (reportData.photos?.fieldPhotoURLs?.length > 0) {
      for (let i = 0; i < reportData.photos.fieldPhotoURLs.length; i++) {
        try {
          const imageUrl = await getImageURL(reportData.photos.fieldPhotoURLs[i]);
          if (imageUrl) {
            const imgBase64 = await loadImageWithOrientation(imageUrl);
            if (xOffset + imgWidth > 195) {
              xOffset = 15;
              yOffset += imgHeight + imgSpacing;
            }
            if (yOffset + imgHeight > 270) {
              doc.addPage();
              yOffset = 20;
            }
            doc.addImage(imgBase64, "JPEG", xOffset, yOffset, imgWidth, imgHeight);
            xOffset += imgWidth + imgSpacing;
          }
        } catch (error) {
          console.error("Error adding field photo:", error);
        }
      }
      yOffset += imgHeight + imgSpacing;
    } else {
      doc.text("첨부된 현장 사진이 없습니다.", 15, yOffset);
      yOffset += 10;
    }

    // Reason Photos section
    yOffset += 10;
    doc.setFontSize(15);
    doc.setTextColor(25, 118, 210);
    doc.text("원인 사진", 15, yOffset);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    yOffset += 7;
    xOffset = 15;
    if (reportData.photos?.reasonPhotoURLs?.length > 0) {
      for (let i = 0; i < reportData.photos.reasonPhotoURLs.length; i++) {
        try {
          const imageUrl = await getImageURL(reportData.photos.reasonPhotoURLs[i]);
          if (imageUrl) {
            const imgBase64 = await loadImageWithOrientation(imageUrl);
            if (xOffset + imgWidth > 195) {
              xOffset = 15;
              yOffset += imgHeight + imgSpacing;
            }
            if (yOffset + imgHeight > 270) {
              doc.addPage();
              yOffset = 20;
            }
            doc.addImage(imgBase64, "JPEG", xOffset, yOffset, imgWidth, imgHeight);
            xOffset += imgWidth + imgSpacing;
          }
        } catch (error) {
          console.error("Error adding reason photo:", error);
        }
      }
      yOffset += imgHeight + imgSpacing;
    } else {
      doc.text("첨부된 원인 사진이 없습니다.", 15, yOffset);
      yOffset += 10;
    }

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(10, 285, 200, 285);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("장애리포트 시스템으로 생성됨", 105, 292, { align: "center" });

    // Save the PDF
    doc.save(`report_${reportData.id}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("PDF 생성에 실패했습니다. 콘솔을 확인해주세요.");
  }
};

// Helper function to load images and auto-rotate based on EXIF orientation
const loadImageWithOrientation = async (url) => {
  // Fetch image as blob
  const response = await fetch(url);
  const blob = await response.blob();

  // Read EXIF orientation
  let orientation = 1;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);
    // Minimal EXIF orientation reader
    for (let i = 0; i < view.byteLength - 1; i++) {
      // Look for EXIF header
      if (view.getUint16(i, false) === 0xFFE1) {
        // EXIF found, look for orientation
        for (let j = i; j < i + 24; j++) {
          if (view.getUint16(j, false) === 0x0112) {
            orientation = view.getUint16(j + 8, false);
            break;
          }
        }
        break;
      }
    }
  } catch (e) {
    // Ignore if cannot read EXIF
  }

  // Load image into canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let w = img.width, h = img.height;
      // Handle orientation
      if (orientation > 4) {
        canvas.width = h;
        canvas.height = w;
      } else {
        canvas.width = w;
        canvas.height = h;
      }
      switch (orientation) {
        case 3:
          ctx.translate(w, h);
          ctx.rotate(Math.PI);
          break;
        case 6:
          ctx.translate(h, 0);
          ctx.rotate(Math.PI / 2);
          break;
        case 8:
          ctx.translate(0, w);
          ctx.rotate(-Math.PI / 2);
          break;
        default:
          // No rotation
          break;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = (error) => {
      console.error("Error loading image:", error);
      reject(new Error(`Failed to load image: ${url}`));
    };
  });
};