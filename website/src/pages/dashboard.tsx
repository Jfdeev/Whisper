import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Mic, FileText, MessageSquare, Brain, Sparkles } from 'lucide-react'

interface Lesson {
  id: string
  name: string
  description: string
  folderId: string | null
  created_at: string
  questionsCount?: number
}

export function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [lessonName, setLessonName] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')

  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  // Fetch recent lessons
  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3333/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
  })

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:3333/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: lessonName,
          description: lessonDescription,
        }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setIsCreating(false)
      setLessonName('')
      setLessonDescription('')
      // Redirecionar para a nova nota
      navigate(`/room/${data.roomId}`)
    },
  })

  const recentLessons = lessons.slice(0, 6)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bem-vindo de volta, {user?.name || 'Estudante'}! 👋
        </h1>
        <p className="text-gray-600">
          Continue aprendendo com a ajuda da Inteligência Artificial
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-blue-200 hover:border-blue-400">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Nova Nota</h3>
                <p className="text-sm text-gray-600">Criar nota do zero</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Nota</DialogTitle>
              <DialogDescription>
                Dê um nome para sua nota. Você poderá adicionar áudio e conteúdo depois.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900">Nome da Nota</Label>
                <Input
                  id="name"
                  placeholder="Ex: Cálculo I - Derivadas"
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && lessonName.trim()) {
                      createLessonMutation.mutate()
                    }
                  }}
                  className="text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Uma breve descrição..."
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  className="text-gray-900"
                />
              </div>
              <Button
                onClick={() => createLessonMutation.mutate()}
                disabled={!lessonName.trim() || createLessonMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {createLessonMutation.isPending ? 'Criando...' : 'Criar Nota'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/create-from-audio')}
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Gravar Áudio</h3>
            <p className="text-sm text-gray-600">Criar nota com gravação</p>
          </CardContent>
        </Card>

        <Card className="cursor-not-allowed opacity-60">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Upload Arquivo</h3>
            <p className="text-sm text-gray-600">Em breve</p>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">O que você pode fazer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Perguntas IA</CardTitle>
              <CardDescription className="text-xs">
                Faça perguntas sobre suas notas e receba respostas contextualizadas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Atividades</CardTitle>
              <CardDescription className="text-xs">
                Gere exercícios e questionários automaticamente com IA
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="w-8 h-8 text-indigo-600 mb-2" />
              <CardTitle className="text-lg">Resumos</CardTitle>
              <CardDescription className="text-xs">
                Crie resumos e mapas mentais do conteúdo das notas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Organização</CardTitle>
              <CardDescription className="text-xs">
                Organize suas notas em pastas como no Obsidian
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Recent Lessons */}
      {recentLessons.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Notas Recentes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/room/${lesson.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{lesson.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {lesson.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {lesson.questionsCount || 0} perguntas
                    </span>
                    <span>
                      {new Date(lesson.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {lessons.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma nota ainda</h3>
            <p className="text-gray-600 mb-4">
              Comece criando sua primeira nota ou gravando um áudio
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Nota
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
