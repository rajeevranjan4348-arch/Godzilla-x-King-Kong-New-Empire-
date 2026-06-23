import React, { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { RiUploadCloudLine, RiFileTextLine, RiEdit2Line, RiSaveLine, RiCloseLine, RiRobot2Line, RiImageLine } from 'react-icons/ri'
import { PDFDocument, rgb } from 'pdf-lib'
import { GoogleGenAI } from '@google/genai'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DocumentsViewProps {
  glassPanel: string
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ glassPanel }) => {
  const [documents, setDocuments] = useState<{id: string, file: File, name: string, lastModified: number, size: number, url: string}[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeDocId, setActiveDocId] = useState<string | null>(null)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)

  
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [extractedText, setExtractedText] = useState<string>('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [annotations, setAnnotations] = useState<{page: number, x: number, y: number, text: string}[]>([])
  const [currentAnnotation, setCurrentAnnotation] = useState<{x: number, y: number, text: string} | null>(null)
  
  const [aiSummary, setAiSummary] = useState<string>('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  
  const [pdfMetadata, setPdfMetadata] = useState<any>(null)
  const [highlights, setHighlights] = useState<{page: number, rects: {x: number, y: number, width: number, height: number}[]}[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newDocs = Array.from(files).map((f: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        name: f.name,
        lastModified: f.lastModified,
        size: f.size,
        url: URL.createObjectURL(f)
      }))
      
      setDocuments(prev => [...prev, ...newDocs])
      
      if (!uploadedFile) {
        selectDocument(newDocs[0])
      }
    }
  }

  const selectDocument = (doc: {id: string, file: File, name: string, lastModified: number, size: number, url: string}) => {
    setActiveDocId(doc.id)
    setUploadedFile(doc.file)
    setFileUrl(doc.url)
    setFileType(doc.file.type)
    setExtractedText('')
    setAiSummary('')
    setAnnotations([])
    setHighlights([])
    setPdfMetadata(null)
    setPageNumber(1)
  }

  const sortedDocuments = [...documents].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name)
    else if (sortBy === 'date') comparison = a.lastModified - b.lastModified
    else if (sortBy === 'size') comparison = a.size - b.size
    
    return sortOrder === 'asc' ? comparison : -comparison
  })


  const onDocumentLoadSuccess = async (pdf: any) => {
    setNumPages(pdf.numPages)
    try {
      const metadata = await pdf.getMetadata()
      setPdfMetadata(metadata.info)
    } catch (e) {
      console.error("Failed to get metadata", e)
    }
  }

  const extractText = async () => {
    if (!fileUrl || !uploadedFile) return null
    setIsExtracting(true)
    try {
      let fullText = ''
      
      if (fileType === 'application/pdf') {
        const loadingTask = pdfjs.getDocument(fileUrl)
        const pdf = await loadingTask.promise
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(' ')
          fullText += `--- Page ${i} ---\n${pageText}\n\n`
        }
      } else if (fileType?.startsWith('text/') || fileType === 'application/json' || uploadedFile.name.endsWith('.md') || uploadedFile.name.endsWith('.csv')) {
        fullText = await uploadedFile.text()
      } else if (fileType?.startsWith('image/')) {
        fullText = 'Image file detected. Use "SUMMARIZE WITH IRIS" to analyze it using Vision AI.'
      } else {
        fullText = 'Unsupported file type for text extraction.'
      }
      
      setExtractedText(fullText)
      return fullText
    } catch (error) {
      console.error('Error extracting text:', error)
      setExtractedText('Failed to extract text.')
      return null
    } finally {
      setIsExtracting(false)
    }
  }

  const summarizeWithIris = async () => {
    if (!fileUrl || !uploadedFile) return
    setIsSummarizing(true)
    try {
      const apiKey = localStorage.getItem('iris_custom_api_key') || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
      const ai = new GoogleGenAI({ apiKey })
      
      if (fileType?.startsWith('image/')) {
        const reader = new FileReader()
        reader.readAsDataURL(uploadedFile)
        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            const base64Data = base64.split(',')[1]
            const response = await ai.models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents: [
                "Please analyze this image and provide a detailed description and summary.",
                { inlineData: { data: base64Data, mimeType: fileType } }
              ]
            })
            setAiSummary(response.text || 'No summary generated.')
          } catch (err) {
            console.error('Error summarizing image:', err)
            setAiSummary('Failed to generate image summary.')
          } finally {
            setIsSummarizing(false)
          }
        }
        return // Wait for reader onload
      }

      let textToSummarize = extractedText
      if (!textToSummarize || textToSummarize.startsWith('Unsupported') || textToSummarize.startsWith('Image file')) {
        const extracted = await extractText()
        if (extracted) textToSummarize = extracted
      }
      
      if (!textToSummarize || textToSummarize.startsWith('Unsupported') || textToSummarize.startsWith('Image file')) {
        setAiSummary('Could not extract valid text to summarize.')
        setIsSummarizing(false)
        return
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Please provide a comprehensive and structured summary of the following document text. Highlight the key points, main arguments, and any important conclusions or action items.\n\nDocument Text:\n${textToSummarize.substring(0, 30000)}`
      })
      
      setAiSummary(response.text || 'No summary generated.')
    } catch (error) {
      console.error('Error summarizing:', error)
      setAiSummary('Failed to generate summary. Please try again.')
    } finally {
      if (!fileType?.startsWith('image/')) {
        setIsSummarizing(false)
      }
    }
  }

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || fileType !== 'application/pdf') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentAnnotation({ x, y, text: '' })
  }

  const handleHighlight = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const pageElement = document.querySelector('.react-pdf__Page')
    if (!pageElement) return

    const pageRect = pageElement.getBoundingClientRect()
    const range = selection.getRangeAt(0)
    const rects = Array.from(range.getClientRects()).map(rect => ({
      x: rect.left - pageRect.left,
      y: rect.top - pageRect.top,
      width: rect.width,
      height: rect.height
    }))

    setHighlights([...highlights, { page: pageNumber, rects }])
    selection.removeAllRanges()
  }

  const saveAnnotation = () => {
    if (currentAnnotation && currentAnnotation.text.trim()) {
      setAnnotations([...annotations, { ...currentAnnotation, page: pageNumber }])
    }
    setCurrentAnnotation(null)
  }

  const exportEditedPdf = async () => {
    if (!uploadedFile || fileType !== 'application/pdf') return
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      for (const ann of annotations) {
        const page = pdfDoc.getPage(ann.page - 1)
        const { height } = page.getSize()
        page.drawText(ann.text, {
          x: ann.x,
          y: height - ann.y,
          size: 14,
          color: rgb(1, 0, 0)
        })
      }

      // Note: Drawing highlights accurately requires knowing the exact PDF coordinate system scale.
      // This is a simplified approximation.
      for (const hl of highlights) {
        const page = pdfDoc.getPage(hl.page - 1)
        const { height } = page.getSize()
        for (const rect of hl.rects) {
          page.drawRectangle({
            x: rect.x,
            y: height - rect.y - rect.height,
            width: rect.width,
            height: rect.height,
            color: rgb(1, 1, 0),
            opacity: 0.5
          })
        }
      }
      
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'edited_' + uploadedFile.name
      a.click()
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF')
    }
  }

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-widest text-emerald-400 flex items-center gap-3">
          <RiFileTextLine /> DOCUMENT ANALYSIS
        </h2>
        
        <div className="flex gap-3">
          <input 
            type="file" 
            accept="application/pdf,image/*,text/*,.md,.csv,.json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            multiple
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center gap-2 text-xs font-bold tracking-widest"
          >
            <RiUploadCloudLine /> UPLOAD FILE
          </button>
          
          {fileUrl && (
            <>
              <button 
                onClick={extractText}
                disabled={isExtracting || fileType?.startsWith('image/')}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 text-xs font-bold tracking-widest disabled:opacity-50"
              >
                <RiFileTextLine /> {isExtracting ? 'EXTRACTING...' : 'EXTRACT TEXT'}
              </button>
              <button 
                onClick={summarizeWithIris}
                disabled={isSummarizing || isExtracting}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 transition-colors flex items-center gap-2 text-xs font-bold tracking-widest disabled:opacity-50"
              >
                <RiRobot2Line /> {isSummarizing ? 'ANALYZING...' : 'ANALYZE WITH IRIS'}
              </button>
              
              {fileType === 'application/pdf' && (
                <>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 text-xs font-bold tracking-widest ${isEditing ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
                  >
                    <RiEdit2Line /> {isEditing ? 'EDITING MODE ON' : 'EDIT PDF'}
                  </button>
                  <button 
                    onClick={handleHighlight}
                    className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-2 text-xs font-bold tracking-widest"
                  >
                    <RiEdit2Line /> HIGHLIGHT
                  </button>
                  {(annotations.length > 0 || highlights.length > 0) && (
                    <button 
                      onClick={exportEditedPdf}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2 text-xs font-bold tracking-widest"
                    >
                      <RiSaveLine /> EXPORT
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Document List Sidebar */}
        <div className={`${glassPanel} w-64 flex flex-col p-4 overflow-hidden shrink-0`}>
          <div className="flex flex-col gap-2 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Documents</h3>
            <div className="flex gap-2">
              <select 
                className="bg-black/50 border border-white/10 text-xs text-zinc-300 p-1.5 rounded flex-1 outline-none focus:border-emerald-500/50 transition-colors" 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as 'name' | 'date' | 'size')}
              >
                <option value="date">Date Modified</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              <select 
                className="bg-black/50 border border-white/10 text-xs text-zinc-300 p-1.5 rounded flex-1 outline-none focus:border-emerald-500/50 transition-colors" 
                value={sortOrder} 
                onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 relative pr-1 custom-scrollbar">
            {documents.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-600 font-mono text-[10px] text-center border border-dashed border-zinc-800 rounded-lg p-4">
                NO FILES<br/>UPLOADED YET
              </div>
            ) : (
              sortedDocuments.map(doc => (
                <button 
                  key={doc.id} 
                  onClick={() => selectDocument(doc)} 
                  className={`p-3 rounded-lg text-left text-xs transition-all ${activeDocId === doc.id ? 'bg-emerald-500/20 text-white border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-black/30 text-zinc-400 border border-transparent hover:bg-black/50 hover:border-white/10'}`}
                >
                  <div className="font-medium truncate mb-1">{doc.name}</div>
                  <div className="text-[10px] font-mono opacity-60 flex justify-between">
                    <span>{(doc.size / 1024).toFixed(1)} KB</span>
                    <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">
        <div className={`${glassPanel} flex flex-col p-4 overflow-hidden relative`}>
          <h3 className="text-xs font-bold tracking-widest text-zinc-400 mb-4 uppercase">
            {fileType?.startsWith('image/') ? 'IMAGE VIEWER' : fileType?.startsWith('text/') ? 'TEXT VIEWER' : 'PDF VIEWER'}
          </h3>
          
          {fileUrl ? (
            <div className="flex-1 overflow-auto bg-zinc-900/50 rounded-lg flex justify-center p-4 relative" onClick={handlePageClick}>
              {fileType === 'application/pdf' ? (
                <>
                  <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="max-w-full"
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="shadow-2xl relative"
                    >
                      {/* Render Highlights */}
                      {highlights.filter(h => h.page === pageNumber).map((highlight, hIdx) => (
                        <React.Fragment key={hIdx}>
                          {highlight.rects.map((rect, rIdx) => (
                            <div
                              key={rIdx}
                              className="absolute bg-yellow-300/40 mix-blend-multiply pointer-events-none z-10"
                              style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
                            />
                          ))}
                        </React.Fragment>
                      ))}
                    </Page>
                  </Document>
                  
                  {/* Render Annotations */}
                  {annotations.filter(a => a.page === pageNumber).map((ann, idx) => (
                    <div 
                      key={idx} 
                      className="absolute text-red-500 font-bold pointer-events-none"
                      style={{ left: ann.x, top: ann.y }}
                    >
                      {ann.text}
                    </div>
                  ))}
                  
                  {/* Current Annotation Input */}
                  {currentAnnotation && (
                    <div 
                      className="absolute bg-black/80 border border-emerald-500 p-2 rounded shadow-xl z-50 flex items-center gap-2"
                      style={{ left: currentAnnotation.x, top: currentAnnotation.y }}
                      onClick={e => e.stopPropagation()}
                    >
                      <input 
                        autoFocus
                        type="text" 
                        value={currentAnnotation.text}
                        onChange={e => setCurrentAnnotation({...currentAnnotation, text: e.target.value})}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveAnnotation()
                          if (e.key === 'Escape') setCurrentAnnotation(null)
                        }}
                        className="bg-transparent text-white outline-none text-sm w-32"
                        placeholder="Type..."
                      />
                      <button onClick={saveAnnotation} className="text-emerald-500 hover:text-emerald-400"><RiSaveLine /></button>
                      <button onClick={() => setCurrentAnnotation(null)} className="text-red-500 hover:text-red-400"><RiCloseLine /></button>
                    </div>
                  )}
                </>
              ) : fileType?.startsWith('image/') ? (
                <img src={fileUrl} alt="Uploaded file" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-full h-full text-zinc-300 font-mono text-sm whitespace-pre-wrap overflow-auto">
                  {extractedText || 'Click "EXTRACT TEXT" to view content.'}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 font-mono text-xs border-2 border-dashed border-zinc-800 rounded-lg">
              NO FILE LOADED
            </div>
          )}
          
          {fileType === 'application/pdf' && numPages > 0 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button 
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(p => p - 1)}
                className="px-3 py-1 bg-zinc-800 rounded text-xs disabled:opacity-50"
              >
                PREV
              </button>
              <span className="text-xs font-mono text-zinc-400">
                PAGE {pageNumber} OF {numPages}
              </span>
              <button 
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(p => p + 1)}
                className="px-3 py-1 bg-zinc-800 rounded text-xs disabled:opacity-50"
              >
                NEXT
              </button>
            </div>
          )}
        </div>

        <div className={`${glassPanel} flex flex-col p-4 overflow-hidden gap-4`}>
          {aiSummary && (
            <div className="flex flex-col flex-shrink-0 max-h-[50%]">
              <h3 className="text-xs font-bold tracking-widest text-indigo-400 mb-2 flex items-center gap-2">
                <RiRobot2Line /> IRIS ANALYSIS
              </h3>
              <div className="flex-1 overflow-auto bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-4">
                <div className="text-sm text-indigo-100 leading-relaxed font-sans">
                  <div className="markdown-body prose prose-invert prose-sm max-w-none prose-indigo">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="relative group overflow-hidden rounded-xl border border-indigo-500/30 my-4">
                              <div className="flex items-center px-4 py-2 bg-indigo-950 border-b border-indigo-500/30">
                                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">{match[1]}</span>
                              </div>
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={vscDarkPlus as any}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)' }}
                              />
                            </div>
                          ) : (
                            <code {...props} className={`${className} bg-indigo-900/50 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs`}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {aiSummary}
                    </Markdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pdfMetadata && (
            <div className="flex flex-col flex-shrink-0">
              <h3 className="text-xs font-bold tracking-widest text-zinc-400 mb-2">PDF METADATA</h3>
              <div className="bg-zinc-900/50 rounded-lg p-4 text-xs text-zinc-300 font-mono grid grid-cols-2 gap-2">
                {Object.entries(pdfMetadata).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-zinc-500 uppercase">{key}</span>
                    <span className="truncate" title={String(value)}>{value ? String(value) : 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400 mb-2">EXTRACTED TEXT</h3>
            <div className="flex-1 overflow-auto bg-zinc-900/50 rounded-lg p-4">
              {extractedText ? (
                <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                  {extractedText}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-xs text-center px-4">
                  {isExtracting ? 'ANALYZING FILE...' : 'NO TEXT EXTRACTED'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default DocumentsView
