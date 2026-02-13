import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  BrainCircuit,
  User,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

type Activity = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  totalQuestions: number;
  timeLimit: number;
  createdAt: string;
};

type Question = {
  id: number;
  question: string;
  alternatives: Alternative[];
  correctAnswer: string;
  explanation: string;
};

type Alternative = {
  id: string;
  text: string;
};

type ActivityResult = {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  results: QuestionResult[];
  completedAt: string;
};

type QuestionResult = {
  questionId: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
};

export function ActivityPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userName, setUserName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [activityResult, setActivityResult] = useState<ActivityResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: activity, isLoading, isError } = useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}`);
      if (!response.ok) throw new Error("Erro ao buscar atividade");
      return response.json();
    },
  });

  const submitMutation = useMutation<ActivityResult, Error, { userName: string; answers: Record<string, string> }>({
    mutationFn: async (payload) => {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Erro ao enviar respostas");
      return response.json();
    },
    onSuccess: (result) => {
      setActivityResult(result);
      setShowResults(true);
      toast.success("Atividade concluída!");
      // Não invalidamos o cache ainda - apenas quando sair
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar respostas");
    },
  });

  // Nova mutation para excluir a atividade
  const deleteActivityMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir atividade");
    },
    onSuccess: () => {
      // Invalidar cache de atividades para que a lista seja atualizada
      queryClient.invalidateQueries({ queryKey: ["get-activities"] });
      toast.success("Voltando à sala...");
    },
    onError: (error) => {
      console.error("Error deleting activity:", error);
      // Mesmo se falhar, navegar de volta
    },
  });

  // Função para sair e excluir a atividade
  const handleExit = async () => {
    await deleteActivityMutation.mutateAsync();
    navigate(-1); // Voltar para a página anterior
  };

  // Timer para atividade
  useEffect(() => {
    if (activity && activity.timeLimit && !showResults) {
      setTimeLeft(activity.timeLimit * 60); // Convert minutes to seconds
    }
  }, [activity, showResults]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      // Auto submit when time runs out
      handleSubmit();
    }
  }, [timeLeft, showResults]);

  // Cleanup: excluir atividade se o usuário sair da página após completar
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (showResults && activityId) {
        // sendBeacon não suporta DELETE, então usamos fetch com keepalive
        fetch(`${API_BASE_URL}/activities/${activityId}`, {
          method: 'DELETE',
          keepalive: true,
        });
      }
    };

    if (showResults) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [showResults, activityId]);

  const handleAnswerChange = (questionId: number, answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleSubmit = () => {
    if (!userName.trim()) {
      toast.error("Por favor, insira seu nome");
      return;
    }

    if (Object.keys(answers).length < (activity?.questions.length || 0)) {
      toast.error("Por favor, responda todas as questões");
      return;
    }

    submitMutation.mutate({ userName: userName.trim(), answers });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  if (isError || !activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Atividade não encontrada</h3>
              <p className="text-gray-600 mb-4">A atividade solicitada não foi encontrada.</p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && activityResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Atividade Concluída!</h1>
              <p className="text-xl text-gray-600">Parabéns, {userName}!</p>
            </div>
          </div>

          {/* Results Summary */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {activityResult.score}/{activityResult.totalQuestions}
                  </div>
                  <div className="text-gray-600">Acertos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {activityResult.percentage}%
                  </div>
                  <div className="text-gray-600">Aproveitamento</div>
                </div>
                <div>
                  <Badge 
                    className={`text-lg px-4 py-2 ${
                      activityResult.percentage >= 70 
                        ? 'bg-green-100 text-green-800' 
                        : activityResult.percentage >= 50 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {activityResult.percentage >= 70 ? 'Excelente!' : 
                     activityResult.percentage >= 50 ? 'Bom!' : 'Precisa Melhorar'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Revisão das Questões</h3>
            {activityResult.results.map((result, index) => (
              <Card key={result.questionId} className="border-l-4 border-l-gray-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 flex-1">
                      {index + 1}. {result.question}
                    </h4>
                    {result.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Sua resposta:</span>
                      <Badge className={result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {result.userAnswer}
                      </Badge>
                    </div>
                    
                    {!result.isCorrect && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Resposta correta:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {result.correctAnswer}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Explicação:</strong> {result.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleExit}
                disabled={deleteActivityMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 text-lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {deleteActivityMutation.isPending ? "Saindo..." : "Voltar à Sala"}
              </Button>
              
              <Button
                onClick={() => {
                  handleExit();
                  // Redirecionar para home após excluir
                  setTimeout(() => navigate('/'), 500);
                }}
                disabled={deleteActivityMutation.isPending}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
              >
                Ir ao Início
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate(-1)}
            variant="ghost" 
            className="mb-4 text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{activity.title}</CardTitle>
                    <CardDescription className="text-base">{activity.description}</CardDescription>
                  </div>
                </div>
                
                {timeLeft !== null && (
                  <div className="flex items-center space-x-2 bg-orange-100 px-4 py-2 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-600">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Name Input */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <User className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Digite seu nome..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                disabled={submitMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-6 mb-8">
          {activity.questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {index + 1}. {question.question}
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {question.alternatives.map((alternative) => (
                    <label
                      key={alternative.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={alternative.id}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                        disabled={submitMutation.isPending}
                      />
                      <span className="flex-1 text-gray-700">{alternative.text}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !userName.trim() || Object.keys(answers).length < activity.questions.length}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 text-lg"
          >
            {submitMutation.isPending ? "Enviando..." : "Finalizar Atividade"}
          </Button>
        </div>
      </div>
    </div>
  );
}