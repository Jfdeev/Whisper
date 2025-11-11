import { useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  MessageCircleQuestion,
  MessageSquare,
  Calendar,
  X,
  Users,
  AlertCircle,
  BrainCircuit,
  Clock,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Link, useParams, useNavigate } from "react-router-dom";


type Room = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

type Question = {
  id: string;
  roomId: string;
  question: string;
  answer: string;
  createdAt: string;
};

type CreateQuestionResponse = {
  questionId: string;
};

type PendingQuestion = {
  id: string;
  question: string;
  createdAt: string;
  isLoading: true;
};

export function Room() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const params = useParams();

  const roomId = params.id;

  // Query para buscar dados da sala
  const {
    data: room,
    isLoading: isRoomLoading,
    isError: isRoomError
  } = useQuery<Room>({
    queryKey: ["get-room", roomId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${roomId}`);
      if (!res.ok) throw new Error("Erro ao buscar sala");
      return res.json();
    }
  });

  // Query para buscar perguntas da sala
  const {
    data: questions,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError
  } = useQuery<Question[]>({
    queryKey: ["get-questions", roomId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${roomId}/questions`);
      if (!res.ok) throw new Error("Erro ao buscar perguntas");
      return res.json();
    }
  });

  // Query para buscar atividades da sala
  const {
    data: activities,
  } = useQuery<Array<{id: string; title: string; description: string; totalQuestions: number; timeLimit: number; createdAt: string}>>({
    queryKey: ["get-activities", roomId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${roomId}/activities`);
      if (!res.ok) throw new Error("Erro ao buscar atividades");
      return res.json();
    }
  });

  const allQuestions = useMemo(() => {
    const realQuestions = questions || [];
    if (pendingQuestion) {
      return [pendingQuestion, ...realQuestions];
    }
    return realQuestions;
  }, [questions, pendingQuestion]);

  // Mutation para criar pergunta
  const createQuestionMutation = useMutation<CreateQuestionResponse, Error, { question: string; }>({
  mutationFn: async (payload: { question: string; }) => {
    const res = await fetch("http://localhost:3333/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        question: payload.question,
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Falha ao criar pergunta: ${res.status} ${text}`);
    }
    return res.json();
  },
  onMutate: async (variables) => {
    // Criar pergunta temporária com loading
    const tempQuestion = {
      id: `temp-${Date.now()}`,
      question: variables.question,
      createdAt: new Date().toISOString(),
      isLoading: true as const
    };
    
    setPendingQuestion(tempQuestion);
    
    // Fechar dialog imediatamente
    setIsDialogOpen(false);
    setQuestionText("");
    
    return { tempQuestion };
  },
  onSuccess: () => {
    toast.success("Pergunta criada com sucesso!");
    
    // Remover pergunta temporária
    setPendingQuestion(null);
    
    // Revalidar queries para mostrar a pergunta real
    queryClient.invalidateQueries({ queryKey: ["get-questions", roomId] });
  },
  onError: (err) => {
    toast.error(err.message || "Erro ao criar pergunta");
    
    // Remover pergunta temporária em caso de erro
    setPendingQuestion(null);
  }
});

  const createActivityMutation = useMutation<
    { id: string; title: string },
    Error
  >({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${roomId}/activities`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erro ao criar atividade");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Atividade criada com sucesso! Redirecionando...");
      // Atualizar lista de atividades
      queryClient.invalidateQueries({ queryKey: ["get-activities", roomId] });
      // Redirecionar para a página da atividade na mesma aba
      setTimeout(() => {
        navigate(`/activity/${data.id}`);
      }, 1500);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar atividade");
    }
  });

  // Função para simular geração de resumo (mocada com erro)
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setShowSummaryModal(true);
    
    // Simular delay de processamento
    setTimeout(() => {
      setIsGeneratingSummary(false);
      toast.error("⚠️ Funcionalidade temporariamente indisponível", {
        description: "Estamos trabalhando para implementar a geração de resumos. Tente novamente em breve!",
        duration: 5000,
      });
    }, 3000);
  };

  const handleCreateQuestion = async () => {
    if (!questionText.trim()) {
      toast.error("Pergunta é obrigatória");
      return;
    }

    await createQuestionMutation.mutateAsync({
      question: questionText.trim(),
    });
  };


  if (isRoomLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (isRoomError || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sala não encontrada</h2>
          <p className="text-gray-600 mb-6">A sala que você está procurando não existe ou foi removida.</p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button
                variant="outline"
                className="mb-6 text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar às salas
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.name}</h1>
                  <p className="text-gray-600 leading-relaxed">{room.description}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    Criada em{" "}
                    {new Date(room.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ferramentas da Sala</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => {
                  createActivityMutation.mutate();
                }}
                disabled={createActivityMutation.isPending}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>{createActivityMutation.isPending ? "Criando..." : "Criar Atividade"}</span>
              </Button>
              
              <Button 
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                variant="outline"
                className="flex items-center space-x-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
              >
                <FileText className="w-4 h-4" />
                <span>{isGeneratingSummary ? "Gerando..." : "Gerar Resumo"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de Gerar Resumo */}
        <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
          <DialogContent className="max-w-md mx-auto bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 relative">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Gerando Resumo
                </DialogTitle>
                <DialogDescription className="text-orange-100 mt-2">
                  {isGeneratingSummary 
                    ? "Nossa IA está analisando o conteúdo da sala..." 
                    : "Processo finalizado"}
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                  onClick={() => setShowSummaryModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>

            <div className="p-6">
              {isGeneratingSummary ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500"></div>
                      <FileText className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Processando Conteúdo</h3>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Analisando transcrições dos áudios...
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                        Identificando pontos principais...
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        Gerando resumo estruturado...
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Funcionalidade em Desenvolvimento</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Estamos trabalhando para implementar a geração automática de resumos. 
                      Esta funcionalidade estará disponível em breve!
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Em breve:</strong> Resumos automáticos com pontos principais, 
                      tópicos discutidos e insights gerados por IA.
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => setShowSummaryModal(false)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  >
                    Entendi
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Activities Section */}
        {activities && activities.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BrainCircuit className="w-6 h-6 text-purple-600 mr-2" />
              Atividades Disponíveis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{activity.title}</h4>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{activity.timeLimit}min</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {activity.totalQuestions} questões
                    </span>
                    <Link to={`/activity/${activity.id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                        Fazer Atividade
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Criada em {new Date(activity.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Question Section */}
        <div className="mb-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Fazer uma Pergunta
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl mx-auto bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 relative">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white flex items-center">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                      <MessageCircleQuestion className="w-4 h-4 text-white" />
                    </div>
                    Nova Pergunta
                  </DialogTitle>
                  <DialogDescription className="text-green-100 mt-2">
                    Adicione sua pergunta e opcionalmente uma resposta para compartilhar conhecimento
                  </DialogDescription>
                </DialogHeader>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </DialogClose>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-gray-700 font-medium flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Pergunta
                  </Label>
                  <textarea
                    id="question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Digite sua pergunta aqui..."
                    rows={3}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-green-500/20 rounded-lg px-4 py-3 resize-none transition-all duration-200 outline-none text-gray-600"
                  />
                </div>


                <DialogFooter className="flex gap-3 pt-4">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-gray-600 hover:text-blue-600 py-3 rounded-lg transition-all duration-200"
                    >
                      Cancelar
                    </Button>
                  </DialogClose>

                  <Button
                    onClick={handleCreateQuestion}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    disabled={createQuestionMutation.isPending}
                  >
                    {createQuestionMutation.isPending ? (
                      <>Criando...</>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Pergunta
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Questions Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Perguntas da Sala</h2>
            <div className="flex items-center text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
              <MessageSquare className="w-5 h-5 mr-2" />
              <span className="font-medium">{questions?.length ?? 0} perguntas</span>
            </div>
          </div>

          {/* Loading State */}
          {isQuestionsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando perguntas...</p>
            </div>
          )}

          {/* Error State */}
          {isQuestionsError && (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Erro ao carregar perguntas.</p>
            </div>
          )}

          {/* Questions List */}
          {allQuestions && allQuestions.length > 0 && (
            <div className="space-y-6">
              {allQuestions.map((question) => {
                const isPendingQuestion = 'isLoading' in question;
                const hasAnswer = !isPendingQuestion && 'answer' in question && question.answer;
                
                const maxAnswerLength = 300;
                const isAnswerLong = hasAnswer && question.answer && question.answer.length > maxAnswerLength;
                const isExpanded = expandedAnswers.has(question.id);
                const displayAnswer = isAnswerLong && !isExpanded 
                  ? question.answer!.substring(0, maxAnswerLength) + "..."
                  : hasAnswer ? question.answer : '';

                const toggleAnswer = () => {
                  const newExpanded = new Set(expandedAnswers);
                  if (isExpanded) {
                    newExpanded.delete(question.id);
                  } else {
                    newExpanded.add(question.id);
                  }
                  setExpandedAnswers(newExpanded);
                };

                return (
                  <div
                    key={question.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircleQuestion className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pergunta</h3>
                          <p className="text-gray-700 leading-relaxed">{question.question}</p>
                        </div>

                        {hasAnswer && question.answer && question.answer.trim() ? (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-md font-semibold text-blue-600 mb-2 flex items-center">
                              <BrainCircuit className="w-5 h-5 text-blue-600 mr-2" />
                              Resposta da IA
                            </h4>
                            <div className="text-gray-700 leading-relaxed">
                              {displayAnswer}
                              {isAnswerLong && (
                                <button 
                                  onClick={toggleAnswer}
                                  className="text-blue-500 hover:text-blue-700 cursor-pointer ml-1 font-medium text-sm transition-colors duration-200"
                                >
                                  {isExpanded ? ' ver menos' : ' ver mais'}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-md font-semibold text-blue-600 mb-2 flex items-center">
                              <BrainCircuit className="w-5 h-5 text-blue-600 mr-2" />
                              IA gerando resposta
                            </h4>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-500 pt-2">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {new Date(question.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {questions && questions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircleQuestion className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma pergunta ainda</h3>
              <p className="text-gray-600 mb-6">Seja o primeiro a fazer uma pergunta nesta sala!</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Fazer Primeira Pergunta
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}