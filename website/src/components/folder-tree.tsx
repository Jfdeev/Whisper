import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, ChevronRight, ChevronDown, Folder, FileText, MoreVertical, FilePlus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Folder {
  id: string
  name: string
  color: string
  parentId: string | null
  createdAt: string
}

interface Lesson {
  id: string
  name: string
  description: string
  folderId: string | null
  created_at: string
  questionsCount?: number
}

export function FolderTree() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [draggedLesson, setDraggedLesson] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null) // 'root' = sem pasta, string = folderId
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  // Fetch folders
  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ['folders'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3333/folders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      return data.folders || []
    },
  })

  // Fetch lessons
  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3333/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
  })

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('http://localhost:3333/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erro ao criar pasta')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setNewFolderName('')
      setCreatingFolder(false)
    },
    onError: (error) => {
      console.error('Erro ao criar pasta:', error)
      alert('Erro ao criar pasta: ' + error.message)
    },
  })

  // Move lesson to folder mutation
  const moveLessonMutation = useMutation({
    mutationFn: async ({ lessonId, folderId }: { lessonId: string; folderId: string | null }) => {
      console.log('API Call - Moving lesson:', lessonId, 'to folder:', folderId)
      
      const res = await fetch(`http://localhost:3333/rooms/${lessonId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folderId }),
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        console.error('API Error:', error)
        throw new Error(error.message || 'Erro ao mover nota')
      }
      
      return res.json()
    },
    onSuccess: (data) => {
      console.log('Nota movida com sucesso:', data)
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      toast.success('Nota movida com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao mover nota:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao mover nota')
    },
  })

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await fetch(`http://localhost:3333/rooms/${lessonId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error('Erro ao excluir nota')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Nota excluída com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao excluir nota')
    },
  })

  function toggleFolder(folderId: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  function handleCreateFolder() {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim())
    }
  }

  function handleDragStart(lessonId: string) {
    setDraggedLesson(lessonId)
  }

  function handleDragOver(e: React.DragEvent, target: string | null) {
    e.preventDefault()
    setDropTarget(target) // pode ser 'root', folderId ou null
  }

  function handleDragLeave() {
    setDropTarget(null)
  }

  function handleDrop(e: React.DragEvent, folderId: string | null) {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedLesson) {
      console.log('Movendo nota:', draggedLesson, 'para pasta:', folderId)
      moveLessonMutation.mutate({ lessonId: draggedLesson, folderId })
      setDraggedLesson(null)
      setDropTarget(null)
    }
  }

  function handleCreateLessonInFolder(folderId: string) {
    // Redireciona para criar nota com folderId na URL
    navigate(`/create-from-audio?folderId=${folderId}`)
  }

  function handleDeleteLesson(lessonId: string, lessonName: string) {
    if (confirm(`Tem certeza que deseja excluir a nota "${lessonName}"?`)) {
      deleteLessonMutation.mutate(lessonId)
    }
  }

  // Build folder tree
  const rootFolders = folders.filter(f => !f.parentId)
  const rootLessons = lessons.filter(l => !l.folderId)

  function renderFolder(folder: Folder, level = 0) {
    const isExpanded = expandedFolders.has(folder.id)
    const childFolders = folders.filter(f => f.parentId === folder.id)
    const folderLessons = lessons.filter(l => l.folderId === folder.id)
    const hasChildren = childFolders.length > 0 || folderLessons.length > 0
    const isDropTarget = dropTarget === folder.id

    return (
      <div key={folder.id} style={{ marginLeft: level * 12 }}>
        <div 
          className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded group ${
            isDropTarget ? 'bg-blue-50 border-2 border-blue-300' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )
            ) : (
              <div className="w-4" />
            )}
          </button>
          <Folder className="w-4 h-4" style={{ color: folder.color }} />
          <span className="text-sm flex-1 text-gray-800 font-medium">{folder.name}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
                <MoreVertical className="w-3 h-3 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreateLessonInFolder(folder.id)}>
                <FilePlus className="w-4 h-4 mr-2" />
                Nova Nota nesta Pasta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && (
          <>
            {childFolders.map(child => renderFolder(child, level + 1))}
            {folderLessons.map(lesson => (
              <div
                key={lesson.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation()
                  handleDragStart(lesson.id)
                }}
                onDragEnd={() => setDraggedLesson(null)}
                onClick={() => navigate(`/room/${lesson.id}`)}
                className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-move group"
                style={{ marginLeft: (level + 1) * 12 + 24 }}
              >
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 flex-1">{lesson.name}</span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-3 h-3 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLesson(lesson.id, lesson.name)
                    }}>
                      <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                      <span className="text-red-500">Excluir Nota</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Minhas Notas</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-gray-200"
          onClick={() => setCreatingFolder(true)}
        >
          <Plus className="w-4 h-4 text-gray-700" />
        </Button>
      </div>

      {/* Create folder input */}
      {creatingFolder && (
        <div className="px-2 flex gap-1">
          <Input
            autoFocus
            size={1}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') {
                setCreatingFolder(false)
                setNewFolderName('')
              }
            }}
            placeholder="Nome da pasta..."
            className="h-7 text-sm text-gray-900"
            disabled={createFolderMutation.isPending}
          />
          <Button 
            size="sm" 
            onClick={handleCreateFolder} 
            className="h-7"
            disabled={createFolderMutation.isPending || !newFolderName.trim()}
          >
            {createFolderMutation.isPending ? '...' : 'OK'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setCreatingFolder(false)
              setNewFolderName('')
            }} 
            className="h-7"
            disabled={createFolderMutation.isPending}
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Folder tree */}
      <div className="space-y-0.5">
        {rootFolders.map(folder => renderFolder(folder))}
        
        {/* Root lessons (without folder) - Always show drop zone */}
        <div className="mt-4">
          <div 
            className={`px-2 py-2 text-xs text-gray-500 rounded transition-all ${
              dropTarget === 'root' ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
            }`}
            onDragOver={(e) => handleDragOver(e, 'root')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            Sem pasta {rootLessons.length > 0 && `(${rootLessons.length})`}
          </div>
          
          {rootLessons.length > 0 && rootLessons.map(lesson => (
              <div
                key={lesson.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation()
                  handleDragStart(lesson.id)
                }}
                onDragEnd={() => setDraggedLesson(null)}
                onClick={() => navigate(`/room/${lesson.id}`)}
                className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-move group"
              >
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 flex-1">{lesson.name}</span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-3 h-3 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLesson(lesson.id, lesson.name)
                    }}>
                      <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                      <span className="text-red-500">Excluir Nota</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
