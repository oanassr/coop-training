import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export async function makeQr(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 240, color: { dark: '#0a4f2f', light: '#ffffff' } })
}

// يحوّل عنصر DOM (بحجم A4) إلى Blob بصيغة PDF
export async function elementToPdfBlob(el: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
  const img = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width
  pdf.addImage(img, 'JPEG', 0, 0, pageW, Math.min(imgH, pageH))
  return pdf.output('blob')
}

export async function downloadPdf(el: HTMLElement, filename: string) {
  const blob = await elementToPdfBlob(el)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
