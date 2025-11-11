import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Learn
            </h1>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-zinc-100">
                Começar Gratuitamente
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Text */}
          <div className="space-y-6">
            <div className="inline-block">
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                Powered by AI
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Aprenda mais com{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Transforme suas notas em conhecimento. Escreva, grave áudio, faça perguntas e crie atividades automaticamente.
            </p>
            <div className="flex gap-4 pt-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="text-zinc-100 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg px-8"
                >
                  Começar Grátis 
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side - Image/Illustration */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📝</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Nota de Cálculo</h3>
                    <p className="text-sm text-gray-500">Editada hoje</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">💬 "O que é uma derivada?"</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">✨ Resposta gerada por IA...</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">📝 Atividade criada: 5 questões</p>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Recursos Poderosos
          </h3>
          <p className="text-gray-600 text-lg">
            Tudo que você precisa para potencializar seus estudos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-blue-100 hover:shadow-lg transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎙️</span>
              </div>
              <CardTitle>Transcrição de Áudio</CardTitle>
              <CardDescription>
                Grave áudios opcionalmente e receba transcrições precisas automaticamente usando IA
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <CardTitle>Perguntas Inteligentes</CardTitle>
              <CardDescription>
                Faça perguntas sobre suas notas e receba respostas contextualizadas pela IA
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <CardTitle>Atividades Automáticas</CardTitle>
              <CardDescription>
                Crie questionários e exercícios automaticamente baseados no conteúdo das notas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <CardTitle>Resumos Inteligentes</CardTitle>
              <CardDescription>
                Gere resumos, mapas mentais e flashcards automaticamente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📁</span>
              </div>
              <CardTitle>Organização Pessoal</CardTitle>
              <CardDescription>
                Organize suas notas em pastas e categorias como Obsidian
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <CardTitle>Progresso & Analytics</CardTitle>
              <CardDescription>
                Acompanhe seu desempenho e progresso nos estudos
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-12 text-center text-white shadow-xl">
          <h3 className="text-4xl font-bold mb-4">
            Pronto para revolucionar seus estudos?
          </h3>
          <p className="text-xl mb-8 text-blue-50">
            Comece gratuitamente e transforme a forma como você aprende
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6"
            >
              Começar Gratuitamente
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2025 AI Learn. Transformando educação com Inteligência Artificial.</p>
        </div>
      </footer>
    </div>
  )
}
