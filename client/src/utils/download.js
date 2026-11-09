import api from "../api/client";

// Downloads a prescription as a PDF.
// The login token is added by our axios instance, so we fetch the file as a "blob"
// and then save it with a temporary link.
export async function downloadPrescription(id) {
  try {
    const { data } = await api.get(`/prescriptions/${id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prescription.pdf";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    alert("Could not download the PDF. Please try again.");
  }
}
