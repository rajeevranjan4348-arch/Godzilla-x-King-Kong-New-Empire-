import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiImage2Line,
  RiDeleteBinLine,
  RiFolderOpenLine,
  RiCloseLine,
  RiMagicLine,
  RiFileWarningLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDownloadLine,
  RiImageAddLine,
  RiTaskLine,
  RiQuestionAnswerLine
} from 'react-icons/ri'
import { useNotificationStore } from '../store/notificationStore'

interface GalleryImage {
  filename: string
  displayName: string
  path: string
  url: string
  createdAt: number
}

const GalleryView = () => {
  const [allImages, setAllImages] = useState<GalleryImage[]>([])
  const [visibleImages, setVisibleImages] = useState<GalleryImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [direction, setDirection] = useState(0)
  const [page, setPage] = useState(1)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const addNotification = useNotificationStore(state => state.addNotification)

  const ITEMS_PER_PAGE = 12
  const observer = useRef<IntersectionObserver | null>(null)

  const lastImageRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleImages.length < allImages.length) {
          setPage((prev) => prev + 1)
        }
      })
      if (node) observer.current.observe(node)
    },
    [visibleImages.length, allImages.length]
  )

  const fetchGallery = async () => {
    try {
      const data = JSON.parse(localStorage.getItem('iris_gallery') || '[]')
      setAllImages(data.sort((a: GalleryImage, b: GalleryImage) => b.createdAt - a.createdAt))
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) return;
    setIsGenerating(true);
    addNotification({ title: 'Generating Image', message: `Please wait while IRIS generates: "${generatePrompt}"...`, type: 'info' });
    try {
      const res = await fetch('/api/gemini/imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatePrompt })
      });
      const data = await res.json();
      if (data.imageBase64) {
        const url = `data:image/jpeg;base64,${data.imageBase64}`;
        const newImage = {
          filename: `generated_${Date.now()}.jpg`,
          displayName: generatePrompt.slice(0, 30) + '...',
          path: `generated/`,
          url: url,
          createdAt: Date.now()
        };
        const currentImages = JSON.parse(localStorage.getItem('iris_gallery') || '[]');
        localStorage.setItem('iris_gallery', JSON.stringify([newImage, ...currentImages]));
        fetchGallery();
        setGeneratePrompt('');
        addNotification({ title: 'Image Generated', message: 'Successfully generated image.', type: 'success' });
      } else {
         addNotification({ title: 'Generation Failed', message: data.error || 'Failed to generate image.', type: 'warning' });
      }
    } catch(err) {
       addNotification({ title: 'Generation Error', message: 'Failed to communicate with generate API.', type: 'warning' });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchGallery()
    const interval = setInterval(fetchGallery, 5000)
    
    const handleCloseMods = () => {
      setShowTaskModal(false)
      setSelectedImage(null)
    }
    window.addEventListener('close-modals', handleCloseMods)

    return () => {
      clearInterval(interval)
      window.removeEventListener('close-modals', handleCloseMods)
    }
  }, [])

  useEffect(() => {
    const endIndex = page * ITEMS_PER_PAGE
    setVisibleImages(allImages.slice(0, endIndex))
  }, [page, allImages])

  const deleteImage = async (filename: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    let currentImages = JSON.parse(localStorage.getItem('iris_gallery') || '[]')
    currentImages = currentImages.filter((img: GalleryImage) => img.filename !== filename)
    localStorage.setItem('iris_gallery', JSON.stringify(currentImages))
    
    if (selectedImage) {
      const currentIndex = allImages.findIndex((img) => img.filename === selectedImage.filename)
      const nextImage = allImages[currentIndex + 1] || allImages[currentIndex - 1]
      if (nextImage) {
        setSelectedImage(nextImage)
      } else {
        setSelectedImage(null)
      }
    }
    fetchGallery()
  }

  const openLocation = async (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    alert(`Opening location: ${path}`)
  }

  const saveCopy = async (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    alert(`Saving copy of: ${path}`)
  }

  const handleAddTask = () => {
    if (!selectedImage || !taskTitle.trim() || !taskDueDate) return;

    const newTask = {
      id: Math.random().toString(36).substring(7),
      title: taskTitle,
      description: 'Task created from Gallery image.',
      dueDate: taskDueDate,
      priority: 'Medium',
      completed: false,
      createdAt: Date.now(),
      imageUrl: selectedImage.url
    };

    const savedTasks = JSON.parse(localStorage.getItem('iris_tasks') || '[]');
    localStorage.setItem('iris_tasks', JSON.stringify([...savedTasks, newTask]));
    window.dispatchEvent(new Event('iris_tasks_updated'));

    addNotification({
      title: 'Task Created',
      message: `Task "${taskTitle}" added with image.`,
      type: 'success'
    });

    setShowTaskModal(false);
    setTaskTitle('');
    setTaskDueDate('');
  };

  const navigateImage = useCallback(
    (newDirection: number) => {
      if (!selectedImage || allImages.length === 0) return
      setDirection(newDirection)
      const currentIndex = allImages.findIndex((img) => img.filename === selectedImage.filename)
      if (currentIndex === -1) return
      let newIndex = currentIndex + newDirection
      if (newIndex >= allImages.length) newIndex = 0
      if (newIndex < 0) newIndex = allImages.length - 1
      setSelectedImage(allImages[newIndex])
    },
    [selectedImage, allImages]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage || showTaskModal) return
      if (e.key === 'ArrowRight') navigateImage(1)
      if (e.key === 'ArrowLeft') navigateImage(-1)
      if (e.key === 'Escape') setSelectedImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, navigateImage, showTaskModal])

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  }

  return (
    <div className="flex-1 bg-white/8 h-full p-8 animate-in fade-in zoom-in duration-500 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6 shrink-0">
        <div className="flex items-center gap-3 text-zinc-100">
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <RiImage2Line className="text-green-400" size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[0.2em] text-zinc-200">VISUAL VAULT</h2>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">GENERATED BY IRIS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 mr-4">
            <input 
              type="text"
              placeholder="Describe an image to generate..."
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-sm rounded-lg px-3 py-1.5 focus:border-green-500 focus:outline-none w-64 text-zinc-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateImage()
              }}
              disabled={isGenerating}
            />
            <button 
              onClick={handleGenerateImage}
              disabled={isGenerating || !generatePrompt.trim()}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-lg transition-colors text-[10px] flex gap-2 items-center tracking-widest"
              title="Generate with Gemini Imagen"
            >
              <RiMagicLine /> {isGenerating ? 'WIRING...' : 'GENERATE'}
            </button>
          </div>
          <button
            onClick={() => document.getElementById('gallery-upload')?.click()}
            className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg border border-green-500/20 transition-colors"
            title="Add Photo"
          >
            <RiImageAddLine size={18} />
          </button>
          <input
            type="file"
            id="gallery-upload"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const newImage = {
                    filename: `upload_${Date.now()}_${file.name}`,
                    displayName: file.name,
                    path: `uploads/${file.name}`,
                    url: event.target?.result as string,
                    createdAt: Date.now()
                  };
                  const currentImages = JSON.parse(localStorage.getItem('iris_gallery') || '[]');
                  localStorage.setItem('iris_gallery', JSON.stringify([newImage, ...currentImages]));
                  fetchGallery();
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />
          <div className="text-[10px] font-mono text-green-300 bg-green-500/10 px-3 py-1.5 rounded border border-green-500/20 shadow-sm flex items-center gap-2">
            <RiMagicLine size={12} /> {allImages.length} ARTIFACTS
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-small pr-2 min-h-0">
        {allImages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <RiImage2Line size={32} className="opacity-30" />
            </div>
            <p className="text-xs tracking-widest opacity-50 font-mono">NO ARTIFACTS FOUND</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pb-10">
            {visibleImages.map((img, index) => {
              const isLast = index === visibleImages.length - 1
              return (
                <div
                  key={`${img.filename}-${index}`}
                  ref={isLast ? lastImageRef : null}
                  role="button"
                  tabIndex={0}
                  aria-label={`View image: ${img.displayName}`}
                  onClick={() => {
                    setDirection(0)
                    setSelectedImage(img)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDirection(0)
                      setSelectedImage(img)
                    }
                  }}
                  className="group relative aspect-16/10 bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden hover:border-green-500/50 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  <img
                    src={img.url}
                    alt={img.displayName}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />
                  <div className="hidden absolute inset-0 items-center justify-center flex-col gap-2 bg-zinc-900">
                    <RiFileWarningLine className="text-red-500/50" size={24} aria-hidden="true" />
                    <span className="text-[8px] text-zinc-500">RENDER ERROR</span>
                  </div>

                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                    <p className="text-[10px] text-zinc-200 line-clamp-1 font-bold mb-0.5 tracking-wide capitalize">
                      {img.displayName}
                    </p>
                    <p className="text-[8px] text-green-400 font-mono mb-3 uppercase tracking-wider opacity-80">
                      {new Date(img.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(img);
                          setShowTaskModal(true);
                        }}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-emerald-600 hover:text-white transition-all backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        title="Add to Task"
                      >
                        <RiTaskLine size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={(e) => openLocation(img.path, e)}
                        aria-label={`Open location for ${img.displayName}`}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-blue-600 hover:text-white transition-all backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        title="Open File Location"
                      >
                        <RiFolderOpenLine size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={(e) => deleteImage(img.filename, e)}
                        aria-label={`Delete ${img.displayName}`}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-red-600 hover:text-white transition-all backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        title="Delete Image"
                      >
                        <RiDeleteBinLine size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && !showTaskModal && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-image-title"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          >
            <button
              onClick={() => setSelectedImage(null)}
              aria-label="Close image viewer"
              className="cursor-pointer absolute top-6 right-6 p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full text-zinc-500 transition-all z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <RiCloseLine size={24} aria-hidden="true" />
            </button>

            <div
              role="button"
              tabIndex={0}
              aria-label="Previous image"
              className="absolute left-0 top-0 bottom-0 w-32 z-40 flex items-center justify-start pl-6 group cursor-pointer hover:bg-linear-to-r from-black/50 to-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"
              onClick={() => navigateImage(-1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigateImage(-1)
                }
              }}
            >
              <div className="p-4 bg-white/5 group-hover:bg-green-500/20 text-zinc-400 group-hover:text-green-400 rounded-full transition-all">
                <RiArrowLeftSLine size={32} aria-hidden="true" />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Next image"
              className="absolute right-0 top-0 bottom-0 w-32 z-40 flex items-center justify-end pr-6 group cursor-pointer hover:bg-linear-to-l from-black/50 to-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"
              onClick={() => navigateImage(1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigateImage(1)
                }
              }}
            >
              <div className="p-4 bg-white/5 group-hover:bg-green-500/20 text-zinc-400 group-hover:text-green-400 rounded-full transition-all">
                <RiArrowRightSLine size={32} aria-hidden="true" />
              </div>
            </div>

            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
              <div className="relative w-full max-w-7xl h-[75vh] flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.img
                    key={selectedImage.filename}
                    src={selectedImage.url}
                    alt={selectedImage.displayName}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 }
                    }}
                    className="absolute max-w-full max-h-full rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 object-contain"
                  />
                </AnimatePresence>
              </div>

              <div className="absolute bottom-10 z-50 flex flex-col items-center gap-6">
                <div className="text-center px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/5">
                  <h3 id="modal-image-title" className="text-xl font-bold text-white mb-1 capitalize">
                    {selectedImage.displayName}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {new Date(selectedImage.createdAt).toLocaleString()} • GENERATED BY IRIS
                  </p>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTaskModal(true)}
                    className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-emerald-900/20 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-xl transition-colors font-bold text-xs shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <RiTaskLine size={16} aria-hidden="true" /> ADD TO TASK
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openLocation(selectedImage.path)}
                    aria-label="Open folder location"
                    className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors font-bold text-xs shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                  >
                    <RiFolderOpenLine size={16} aria-hidden="true" /> OPEN FOLDER
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => saveCopy(selectedImage.path)}
                    aria-label="Save a copy"
                    className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-blue-900/20 hover:bg-blue-600 text-blue-200 hover:text-white rounded-xl transition-colors font-bold text-xs shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <RiDownloadLine size={16} aria-hidden="true" /> SAVE COPY
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteImage(selectedImage.filename)}
                    aria-label="Delete image"
                    className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-red-900/20 hover:bg-red-600 text-red-200 hover:text-white rounded-xl transition-colors font-bold text-xs shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <RiDeleteBinLine size={16} aria-hidden="true" /> DELETE
                  </motion.button>
                </div>

                <div className="mt-2 w-full max-w-xl bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <RiQuestionAnswerLine className="text-emerald-400" size={20} />
                    <input
                      type="text"
                      placeholder="Ask IRIS about this image..."
                      className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-500 focus:outline-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const question = e.currentTarget.value.trim();
                          
                          // Teleport to chat
                          const chatTab = document.getElementById('tab-CHAT') as HTMLButtonElement;
                          if (chatTab) chatTab.click();
                          
                          // Send message
                          import('../services/Iris-voice-ai').then(({ irisService }) => {
                            irisService.sendText(question);
                          });
                          
                          setSelectedImage(null);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">Add Photo to Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Task Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    placeholder="E.g., Review this document"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!taskTitle.trim() || !taskDueDate}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GalleryView
