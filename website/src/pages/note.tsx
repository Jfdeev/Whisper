import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, Save, Sparkles, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

interface Note {
  id: string
  name: string
  description: string
  content: string
  folderId: string | null
  created_at: string
  updated_at: string
}

interface AudioChunk {
  id: string
  transcription: string
  created_at: string
}

type TabType = 'editor' | 'audio' | 'questions' | 'activities' | 'summary'

export function NotePage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const token = localStorage.getItem('token')

  const [activeTab, setActiveTab] = useState<TabType>('editor')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isButtonSave, setIsButtonSave] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [summary, setSummary] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch note data
  const { data: note, isLoading } = useQuery<Note>({
    queryKey: ['note', id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Nota não encontrada')
      return res.json()
    },
    enabled: !!id,
  })

  // Reset states when note ID changes
  useEffect(() => {
    console.log('[NOTE] ID changed, resetting states:', id)
    setTitle('')
    setContent('')
    setActiveTab('editor')
    setShowPreview(false)
    setChatMessages([])
    setChatInput('')
    setSummary('')
  }, [id])

  // Update local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.name)
      setContent(note.content || '')
    }
  }, [note])

  // Fetch audio chunks
  const { data: audioChunks = [] } = useQuery<AudioChunk[]>({
    queryKey: ['audio-chunks', id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${id}/audio-chunks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!id && activeTab === 'audio',
  })

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log('[SAVE NOTE] Sending:', { title, content })
      const res = await fetch(`http://localhost:3333/rooms/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: title,
          content: content,
        }),
      })
      if (!res.ok) {
        const error = await res.text()
        console.error('[SAVE NOTE] Error response:', error)
        throw new Error('Erro ao salvar')
      }
      const data = await res.json()
      console.log('[SAVE NOTE] Success:', data)
      return data
    },
    onSuccess: (data) => {
      // Update the cache directly with the new data
      queryClient.setQueryData(['note', id], data)
      if(isButtonSave) {
        toast.success('Nota salva!')
        setIsButtonSave(false)
      }
      setIsSaving(false)
    },
    onError: (error) => {
      console.error('[SAVE NOTE] Mutation error:', error)
      toast.error('Erro ao salvar nota')
      setIsSaving(false)
    },
  })

  const handleSave = () => {
    setIsSaving(true)
    saveMutation.mutate()
  }

    // Auto-save on blur
  const handleBlur = () => {
    if (title !== note?.name || content !== note?.content) {
      handleSave()
    }
  }

  // AI Commands Mutations
  const continueTextMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3333/ai/continue-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: content, roomId: id }),
      })
      if (!res.ok) throw new Error('Erro ao continuar texto')
      return res.json()
    },
    onSuccess: (data) => {
      setAiSuggestion(data.continuation)
      setShowSuggestion(true)
      setIsLoadingSuggestion(false)
    },
    onError: () => {
      setIsLoadingSuggestion(false)
      setShowSuggestion(false)
    },
  })

  // Fetch AI suggestion automatically while typing
  useEffect(() => {
    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }

    // Don't suggest if content is too short or in preview mode
    if (content.length < 50 || showPreview) {
      setShowSuggestion(false)
      return
    }

    // Wait 2 seconds after user stops typing
    suggestionTimeoutRef.current = setTimeout(() => {
      setIsLoadingSuggestion(true)
      continueTextMutation.mutate()
    }, 2000)

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
    }
  }, [content, showPreview])

  // Auto-save effect - saves after 3 seconds of inactivity
  useEffect(() => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Don't auto-save if note hasn't loaded yet or is currently saving
    if (!note || isSaving) return

    // Check if there are changes
    const hasChanges = title !== note.name || content !== (note.content || '')
    
    if (hasChanges) {
      console.log('[AUTO-SAVE] Changes detected, scheduling save...', { 
        currentTitle: title, 
        savedTitle: note.name,
        currentContent: content.substring(0, 50),
        savedContent: (note.content || '').substring(0, 50)
      })
      saveTimeoutRef.current = setTimeout(() => {
        console.log('[AUTO-SAVE] Executing save with:', { title, content: content.substring(0, 100) })
        handleSave()
      }, 3000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, note, isSaving])

  // Accept AI suggestion with Tab key
  const acceptSuggestion = () => {
    if (showSuggestion && aiSuggestion) {
      setContent(content + ' ' + aiSuggestion)
      setShowSuggestion(false)
      setAiSuggestion('')
    }
  }

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3333/ai/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Erro ao gerar resumo')
      return res.json()
    },
    onSuccess: (data) => {
      setSummary(data.summary)
      setActiveTab('summary')
      toast.success('Resumo gerado!')
    },
    onError: () => {
      toast.error('Erro ao gerar resumo')
    },
  })

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch(`http://localhost:3333/ai/chat-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          question,
          roomId: id,
          conversationHistory: chatMessages
        }),
      })
      if (!res.ok) throw new Error('Erro ao enviar pergunta')
      return res.json()
    },
    onSuccess: (data) => {
      // Add assistant message
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
      setIsSendingMessage(false)
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    },
    onError: () => {
      toast.error('Erro ao enviar pergunta')
      setIsSendingMessage(false)
    },
  })

  // Fetch existing activities
  const { data: activities = [] } = useQuery<Array<{ id: string; title: string; timeLimit: number }>>({
    queryKey: ['activities', id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${id}/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!id && activeTab === 'activities',
  })

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${id}/activities`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao criar atividade')
      return res.json()
    },
    onSuccess: (data: { id: string }) => {
      toast.success('Atividade criada! Redirecionando...')
      queryClient.invalidateQueries({ queryKey: ['activities', id] })
      setTimeout(() => {
        window.location.href = `/activity/${data.id}`
      }, 1000)
    },
    onError: () => {
      toast.error('Erro ao criar atividade')
    },
  })

  const handleSendMessage = () => {
    if (!chatInput.trim() || isSendingMessage) return

    // Add user message
    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setIsSendingMessage(true)
    
    // Send to AI
    chatMutation.mutate(userMessage)
  }

  // Handle textarea input
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Accept AI suggestion with Tab
    if (e.key === 'Tab' && showSuggestion && aiSuggestion) {
      e.preventDefault()
      acceptSuggestion()
      return
    }
    
    // Hide suggestion on Escape
    if (e.key === 'Escape' && showSuggestion) {
      setShowSuggestion(false)
      setAiSuggestion('')
      e.preventDefault()
    }
  }

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        await uploadAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success('Gravação iniciada!')
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      toast.error('Erro ao acessar microfone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.info('Processando áudio...')
    }
  }

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const res = await fetch(`http://localhost:3333/rooms/${id}/upload-audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) throw new Error('Erro ao enviar áudio')
      
      toast.success('Áudio transcrito com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['audio-chunks', id] })
    } catch (error) {
      console.error('Erro ao enviar áudio:', error)
      toast.error('Erro ao processar áudio')
    }
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando nota...</div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Nota não encontrada</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
        {/* Title Bar - Simple */}
        <div className="border-b px-6 py-3 flex items-center justify-between bg-white">
          <div className="flex-1 flex items-center gap-3">
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false)
                  handleBlur()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false)
                    handleBlur()
                  }
                }}
                className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
              >
                {title || 'Sem título'}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AI Tools - Only show in editor tab */}
            {activeTab === 'editor' && !showPreview && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!content.trim()) {
                      toast.error('Adicione conteúdo primeiro')
                      return
                    }
                    generateSummaryMutation.mutate()
                  }}
                  disabled={generateSummaryMutation.isPending || !content.trim()}
                  className='bg-blue-600 hover:bg-blue-700'
                  title="Gerar resumo do conteúdo"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  {generateSummaryMutation.isPending ? 'Gerando...' : 'Resumo'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!content.trim()) {
                      toast.error('Escreva algo primeiro')
                      return
                    }
                    continueTextMutation.mutate()
                  }}
                  className='bg-blue-600 hover:bg-blue-700'
                  disabled={continueTextMutation.isPending || !content.trim()}
                  title="IA continua escrevendo"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {continueTextMutation.isPending ? 'Gerando...' : 'Continuar'}
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
              </>
            )}
            
            <Button
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {showPreview ? '✏️ Editar' : '👁️ Preview'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsButtonSave(true)
                handleSave()
              }}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col relative">
            {/* Tabs */}
            <div className="border-b px-6 py-2 flex gap-4 bg-gray-50">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'editor'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                📝 Nota
              </button>
              <button
                onClick={() => setActiveTab('audio')}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'audio'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🎤 Áudio
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'questions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                ❓ Perguntas
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'activities'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                📚 Atividades
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'summary'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Resumo
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'editor' && (
                <div className="h-full">
                  {showPreview ? (
                    <div className="prose prose-slate max-w-none p-8 bg-white text-gray-900">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content || '*Nenhum conteúdo ainda...*'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col relative">
                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder="Digite suas anotações aqui... Use Markdown para formatar!

# Título
## Subtítulo

**Negrito** *Itálico*

- Lista
- De
- Itens

Use os botões da barra de ferramentas para comandos da IA..."
                        className="flex-1 w-full p-6 text-gray-800 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                      />

                      {/* AI Suggestion Overlay */}
                      {showSuggestion && aiSuggestion && !showPreview && (
                        <div className="absolute bottom-4 right-4 max-w-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-2xl p-4 border-2 border-blue-400 animate-in slide-in-from-bottom-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">✨</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold uppercase tracking-wide">Sugestão da IA</p>
                                <button
                                  onClick={() => {
                                    setShowSuggestion(false)
                                    setAiSuggestion('')
                                  }}
                                  className="text-white/70 hover:text-white text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                              <p className="text-sm leading-relaxed mb-3">
                                {aiSuggestion}
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={acceptSuggestion}
                                  className="bg-white text-blue-600 hover:bg-blue-50 h-7 text-xs"
                                >
                                  Aceitar (Tab)
                                </Button>
                                <button
                                  onClick={() => {
                                    setShowSuggestion(false)
                                    setAiSuggestion('')
                                  }}
                                  className="text-xs text-white/70 hover:text-white"
                                >
                                  Ignorar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Loading Suggestion Indicator */}
                      {isLoadingSuggestion && !showSuggestion && (
                        <div className="absolute bottom-4 right-4 bg-blue-500 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Gerando sugestão...
                        </div>
                      )}

                      {/* Floating Record Button */}
                      <Button
                        size="lg"
                        onClick={handleMicClick}
                        className={`fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-2xl z-40 transition-all ${
                          isRecording 
                            ? 'bg-gradient-to-r from-red-600 to-pink-700 animate-pulse' 
                            : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                        }`}
                      >
                        <Mic className="w-6 h-6" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">🎤 Gravações de Áudio</h2>
                    <Button
                      onClick={handleMicClick}
                      variant={isRecording ? "destructive" : "default"}
                      className="gap-2"
                    >
                      <Mic className="w-4 h-4" />
                      {isRecording ? 'Parar Gravação' : 'Gravar Áudio'}
                    </Button>
                  </div>

                  {audioChunks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Mic className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma gravação ainda</p>
                      <p className="text-sm mt-2">
                        Clique no botão acima ou use o botão flutuante para gravar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {audioChunks.map((chunk) => (
                        <div
                          key={chunk.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Mic className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-gray-500 mb-2">
                                {new Date(chunk.created_at).toLocaleString('pt-BR')}
                              </div>
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {chunk.transcription}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🤖</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Professor IA</h2>
                        <p className="text-sm text-white/80">Tire suas dúvidas sobre a aula</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">💬</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Comece a Conversar!</h3>
                          <p className="text-gray-600 mb-4">
                            Faça perguntas sobre o conteúdo da aula. O Professor IA tem todo o contexto dos áudios gravados.
                          </p>
                          <div className="bg-white rounded-lg p-4 text-left space-y-2 text-sm text-gray-700">
                            <p className="font-semibold">💡 Exemplos de perguntas:</p>
                            <p>• "O que foi discutido sobre banco de dados?"</p>
                            <p>• "Pode explicar melhor o conceito de tabelas?"</p>
                            <p>• "Como aplicar isso na prática?"</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                                  : 'bg-white text-gray-900 shadow-md border border-gray-200'
                              }`}
                            >
                              {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs">🤖</span>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-600">Professor IA</span>
                                </div>
                              )}
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {isSendingMessage && (
                          <div className="flex justify-start">
                            <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="border-t bg-white p-4">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="Digite sua dúvida..."
                        className="flex-1 text-gray-900"
                        disabled={isSendingMessage}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isSendingMessage}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        {isSendingMessage ? 'Enviando...' : 'Enviar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50">
                  {/* Header */}
                  <div className="border-b bg-white p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-3xl">📚</span>
                        Atividades
                      </h2>
                      <Button
                        onClick={() => createActivityMutation.mutate()}
                        disabled={createActivityMutation.isPending}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                      >
                        {createActivityMutation.isPending ? 'Criando...' : '+ Nova Atividade'}
                      </Button>
                    </div>
                    <p className="text-gray-600 mt-2">
                      Atividades geradas automaticamente com base no conteúdo dos áudios desta sala
                    </p>
                  </div>

                  {/* Activities List */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {activities.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-5xl">🎯</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Nenhuma atividade criada</h3>
                          <p className="text-gray-600 mb-6">
                            Crie sua primeira atividade para testar seus conhecimentos sobre o conteúdo desta sala.
                          </p>
                          <Button
                            size="lg"
                            onClick={() => createActivityMutation.mutate()}
                            disabled={createActivityMutation.isPending}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                          >
                            {createActivityMutation.isPending ? 'Criando...' : 'Criar Primeira Atividade'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            onClick={() => window.location.href = `/activity/${activity.id}`}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer p-6 border-2 border-transparent hover:border-purple-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{activity.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    ⏱️ {activity.timeLimit} minutos
                                  </span>
                                </div>
                              </div>
                              <div className="text-purple-600 text-2xl">→</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="h-full flex flex-col bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
                  {summary ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-orange-600" />
                          Resumo Gerado
                        </h2>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!content.trim()) {
                              toast.error('Adicione conteúdo para gerar resumo')
                              return
                            }
                            generateSummaryMutation.mutate()
                          }}
                          disabled={generateSummaryMutation.isPending || !content.trim()}
                        >
                          {generateSummaryMutation.isPending ? 'Gerando...' : 'Regenerar'}
                        </Button>
                      </div>
                      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
                        <div className="prose prose-slate max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {summary}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Gerar Resumo</h3>
                        <p className="text-gray-600 mb-6">
                          A IA irá analisar todo o conteúdo da nota e criar um resumo estruturado com os pontos principais.
                        </p>
                        <Button
                          size="lg"
                          onClick={() => {
                            if (!content.trim()) {
                              toast.error('Adicione conteúdo para gerar resumo')
                              return
                            }
                            generateSummaryMutation.mutate()
                          }}
                          disabled={generateSummaryMutation.isPending || !content.trim()}
                          className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white"
                        >
                          {generateSummaryMutation.isPending ? 'Gerando Resumo...' : 'Gerar Resumo'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}
