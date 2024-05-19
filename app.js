document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('createPdfButton').addEventListener('click', () => {
        const input = document.getElementById('fileInput');
        const notes = document.getElementById('notes').value;
        const notesPosition = document.querySelector('input[name="notesPosition"]:checked').value;
        let customFileName = document.getElementById('fileNameInput').value.trim();

        if (input.files.length > 0) {
            if (customFileName && !customFileName.toLowerCase().endsWith('.pdf')) {
                customFileName += '.pdf';
            }
            createPdf(input.files, notes, notesPosition, customFileName);
        } else {
            alert('Please select images to create a PDF.');
        }
    });

    document.getElementById('viewPdfButton').addEventListener('click', async () => {
        const input = document.getElementById('fileInput');
        const notes = document.getElementById('notes').value;
        const notesPosition = document.querySelector('input[name="notesPosition"]:checked').value;
        let customFileName = document.getElementById('fileNameInput').value.trim();

        if (input.files.length > 0) {
            if (customFileName && !customFileName.toLowerCase().endsWith('.pdf')) {
                customFileName += '.pdf';
            }

            // Open a blank window first
            const newWindow = window.open("", "_blank");

            const pdfBlob = await createPdf(input.files, notes, notesPosition, customFileName, true);
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Assign the new URL to the previously opened window
            newWindow.location.href = pdfUrl;
        } else {
            alert('Please select images to view the PDF.');
        }
    });

    async function createPdf(files, notes, notesPosition, customFileName, returnBlob = false) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const promises = Array.from(files).map(file => resizeImage(file, 1024, 1024));

        const images = await Promise.all(promises);

        if (notes && notes.trim() !== '') {
            if (notesPosition === 'first') {
                addNotesPage(pdf, notes);
                images.forEach((imgData, index) => {
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0);
                });
            } else {
                images.forEach((imgData, index) => {
                    if (index > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0);
                });
                pdf.addPage();
                addNotesPage(pdf, notes);
            }
        } else {
            images.forEach((imgData, index) => {
                if (index > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0);
            });
        }

        const fileName = customFileName || generateDefaultFileName();
        const pdfBlob = pdf.output('blob');

        if (returnBlob) {
            return pdfBlob;
        } else {
            savePdf(fileName, pdfBlob);
        }
    }

    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        });
    }

    function addNotesPage(pdf, notes) {
        const canvas = document.createElement('canvas');
        canvas.width = 595; // A4 size in pt (210mm)
        canvas.height = 842; // A4 size in pt (297mm)
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '16px Arial';
        ctx.fillStyle = 'black';

        const lines = notes.split('\n');
        let y = 30;
        lines.forEach(line => {
            ctx.fillText(line.trim(), 20, y);
            y += 20;
        });

        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 210, 297);
    }

    function generateDefaultFileName() {
        const appName = "PIXtoPDF";
        const date = new Date();
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const formattedTime = `${hours % 12 || 12}.${minutes}${hours >= 12 ? 'PM' : 'AM'}`;
        return `${appName}_${formattedDate}_${formattedTime}.pdf`;
    }

    function savePdf(fileName, pdfBlob) {
        // Check if the device is mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile && navigator.share) {
            navigator.share({
                title: 'PDF Document',
                files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
            }).catch(console.error);
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(pdfBlob);
            link.download = fileName;
            link.click();
        }
    }
});
