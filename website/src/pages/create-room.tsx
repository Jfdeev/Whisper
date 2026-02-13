import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Mic, Plus, Trash2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

type Room = {
  id: string;
  name: string;
  description: string;
  questionsCount: number;
  created_at: string;
};

type Rooms = Room[];

type CreateRoomResponse = {
  id: string;
};

export function CreateRoom() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: rooms,
    isLoading: isRoomsLoading,
    isError: isRoomsError,
  } = useQuery<Rooms>({
    queryKey: ["get-rooms"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/rooms`);
      if (!res.ok) throw new Error("Erro ao buscar salas");
      const data: Rooms = await res.json();
      return data;
    },
  });

  const createRoomMutation = useMutation<
    CreateRoomResponse,
    Error,
    { name: string; description: string }
  >({
    mutationFn: async (payload: { name: string; description: string }) => {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // tenta ler corpo para mensagem de erro
        const text = await res.text().catch(() => "");
        throw new Error(`Falha ao criar sala: ${res.status} ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Sala criada com sucesso!");
      // Atualiza a lista de salas
      queryClient.invalidateQueries({ queryKey: ["get-rooms"] });
      // Fecha o dialog
      setIsDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar sala");
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Falha ao deletar sala: ${res.status} ${text}`);
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Sala deletada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["get-rooms"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao deletar sala");
    },
  });

  useEffect(() => {
    if (!deleteRoomMutation.isPending) {
      queryClient.invalidateQueries({ queryKey: ["get-rooms"] });
    }
  }, [deleteRoomMutation.isPending, queryClient]);

  const handleCreateRoom = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const name = (formData.get("name") as string) ?? "";
    const description = (formData.get("description") as string) ?? "";

    // validações simples
    if (!name.trim()) {
      toast.error("Nome da sala é obrigatório");
      return;
    }

    await createRoomMutation.mutateAsync({
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Whisper</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra salas incríveis para fazer suas perguntas ou criar a sua
            própria
          </p>
        </div>

        {/* Create Room Dialog */}
        <div className="text-center mb-8">
          <div className="flex gap-4 justify-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Nova Sala
                </Button>
              </DialogTrigger>

              {/* Dialog content remains the same */}
              <DialogContent className="max-w-md mx-auto bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 relative">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      Criar Nova Sala
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2">
                      Preencha os detalhes para criar uma sala de perguntas
                      incrível
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

                <form
                  className="p-6 space-y-6"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const form = event.currentTarget as HTMLFormElement;
                    await handleCreateRoom(form);
                    // reset do formulário após sucesso (opcional)
                    if (!createRoomMutation.isError) {
                      form.reset();
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="room-name"
                      className="text-gray-700 font-medium flex items-center"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Nome da Sala
                    </Label>
                    <Input
                      id="room-name"
                      name="name"
                      placeholder="Ex: Discussões sobre React"
                      required
                      className="border-2 border-gray-200 rounded-lg px-4 py-3 transition-all duration-200 text-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="room-description"
                      className="text-gray-700 font-medium flex items-center"
                    >
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                      Descrição
                    </Label>
                    <textarea
                      id="room-description"
                      name="description"
                      placeholder="Descreva sobre o que será discutido nesta sala..."
                      rows={3}
                      className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg px-4 py-3 resize-none transition-all duration-200 outline-none text-gray-600"
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
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      disabled={createRoomMutation.isPending}
                    >
                      {createRoomMutation.isPending ? (
                        // simples indicador
                        <>Criando...</>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Sala
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* New button for creating room from audio */}
            <Link to="/create-from-audio">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Mic className="w-5 h-5 mr-2" />
                Criar com Áudio
              </Button>
            </Link>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6 max-w-2xl mx-auto">
            <p className="text-green-800 font-medium">
              Agora é possivel criar salas automaticamente a partir de gravações
              de áudio! <br />
              Com isso sendo possivel extrair o contexto da conversa e criar
              salas interativas com esse contexto sem precisar alimentar a sala
              com os audios.
            </p>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Salas Disponíveis
            </h2>
            <div className="flex items-center text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-medium">{rooms?.length ?? 0} salas</span>
            </div>
          </div>

          {/* Loading State */}
          {isRoomsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando salas...</p>
            </div>
          )}

          {/* Error State */}
          {isRoomsError && (
            <div className="text-center py-8 text-red-500">
              Erro ao carregar salas.
            </div>
          )}

          {/* Rooms Grid */}
          {rooms && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 border border-gray-200 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-600 font-medium px-3 py-1 rounded-full">
                        {room.questionsCount} Perguntas
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          if (
                            confirm(
                              `Tem certeza que deseja deletar a sala "${room.name}"? Esta ação não pode ser desfeita.`
                            )
                          ) {
                            deleteRoomMutation.mutate(room.id);
                          }
                        }}
                        disabled={deleteRoomMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {room.name}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {room.description}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mt-auto">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Criada em{" "}
                      {new Date(room.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <Link to={`/room/${room.id}`}>
                    <Button className="w-full mt-4 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300">
                      Entrar na Sala
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {rooms && rooms.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma sala encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Seja o primeiro a criar uma sala e iniciar as conversas!
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Sala
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 mt-16">
          <p>Escolha uma sala existente ou crie a sua própria para começar</p>
        </div>
      </div>
    </div>
  );
}
