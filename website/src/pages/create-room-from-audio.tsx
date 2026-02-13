import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Square, Upload, Loader, Play, Pause } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

type CreateRoomResponse = {
    room: {
        id: string;
        name: string;
        description: string;
        createdAt: string;
    };
    chunk: {
        id: string;
        transcriptionLength: number;
    };
};

export function CreateRoomFromAudio() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();

    function stopRecording() {
        setIsRecording(false);

        if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
            mediaRecorder.current.stop();
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }
    
    async function createRoomFromAudio(audio: Blob) {
        setIsProcessing(true);
        
        try {
            const formData = new FormData();
            formData.append("file", audio, 'audio.webm');

            const response = await fetch(`${API_BASE_URL}/rooms/from-audio`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro: ${response.status}`);
            }

            const result: CreateRoomResponse = await response.json();

            toast.success("Sala criada com sucesso!");
            navigate(`/room/${result.room.id}`);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao processar áudio");
        } finally {
            setIsProcessing(false);
        }
    }

    async function startRecording() {
        try {
            setIsRecording(true);
            setRecordingTime(0);

            const audio = await navigator.mediaDevices.getUserMedia({ 
                audio: true
            });

            mediaRecorder.current = new MediaRecorder(audio);

            const chunks: Blob[] = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setRecordedAudio(blob);
                
                // Criar URL para reprodução
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                
                // Para todos os tracks de áudio
                audio.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.onstart = () => {
                
                // Timer para mostrar duração da gravação
                timerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);
            };

            mediaRecorder.current.start();

        } catch (error) {
            toast.error("Erro ao acessar microfone");
            setIsRecording(false);
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCreateRoom = async () => {
        if (!recordedAudio) {
            toast.error("Nenhum áudio gravado");
            return;
        }

        await createRoomFromAudio(recordedAudio);
    };

    const resetRecording = () => {
        setRecordedAudio(null);
        setRecordingTime(0);
        setIsPlaying(false);
        
        // Limpar URL do áudio anterior
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
        
        // Parar áudio se estiver tocando
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    const togglePlayPause = () => {
        if (!audioUrl) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
            });
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">🎤 Criar Sala com Áudio</h1>
                        <p className="text-lg text-gray-600">
                            Grave um áudio sobre o assunto que deseja estudar e nossa IA criará automaticamente uma sala de estudo personalizada
                        </p>
                    </div>

                    {/* Back Button */}
                    <div className="mb-6">
                        <Link to="/">
                            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>
                        </Link>
                    </div>

                    {/* Recording Card */}
                    <div className="p-8 bg-white shadow-xl border-0 rounded-2xl backdrop-blur-sm">
                        <div className="text-center">
                            {isRecording ? (
                                <div className="py-8">
                                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                        <Mic className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Gravando...</h3>
                                    <p className="text-gray-600 mb-6">
                                        Fale sobre o assunto que deseja estudar
                                    </p>
                                    <p className="text-red-600 font-mono text-xl mb-6">
                                        {formatTime(recordingTime)}
                                    </p>
                                    <Button 
                                        onClick={stopRecording}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 text-lg shadow-lg"
                                    >
                                        <Square className="w-5 h-5 mr-2" />
                                        Parar Gravação
                                    </Button>
                                </div>
                            ) : isProcessing ? (
                                <div className="py-12">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Loader className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Processando áudio...</h3>
                                    <p className="text-gray-600">
                                        Nossa IA está analisando seu áudio e criando uma sala personalizada
                                    </p>
                                </div>
                            ) : recordedAudio ? (
                                <div className="py-8">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Square className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Áudio gravado!</h3>
                                    <p className="text-gray-600 mb-6">
                                        Duração: {formatTime(recordingTime)}
                                    </p>
                                    
                                    {/* Audio Preview Controls */}
                                    <div className="mb-6">
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center justify-center">
                                                Preview do áudio
                                            </h4>
                                            <div className="flex justify-center">
                                                <Button
                                                    onClick={togglePlayPause}
                                                    variant="outline"
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"  
                                                >
                                                    {isPlaying ? (
                                                        <>
                                                            <Pause className="w-4 h-4" />
                                                            Pausar
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="w-4 h-4" />
                                                            Reproduzir
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4 justify-center">
                                        <Button
                                            onClick={resetRecording}
                                            variant="outline"
                                            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                                        >
                                            Gravar novamente
                                        </Button>
                                        
                                        <Button
                                            onClick={handleCreateRoom}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-2 shadow-lg"
                                            disabled={isProcessing}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Criar Sala
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Mic className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Pronto para gravar</h3>
                                    <p className="text-gray-600 mb-8">
                                        Clique no botão abaixo e fale sobre o assunto que deseja estudar.
                                        Nossa IA criará automaticamente o nome e descrição da sala.
                                    </p>
                                    
                                    <Button 
                                        onClick={startRecording}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 text-lg shadow-lg"
                                    >
                                        <Mic className="w-5 h-5 mr-2" />
                                        Iniciar Gravação
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
