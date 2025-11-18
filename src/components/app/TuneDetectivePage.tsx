"use client";

import { useState, useEffect, useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getRecommendations, analyzeSong, getEmotionRecommendations } from "@/lib/actions";
import type { Song } from "@/lib/types";
import { initialSongs } from "@/lib/data";
import {
  Music,
  Search,
  LoaderCircle,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Upload,
  FileMusic,
  Camera,
  HeartPulse,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Emotion } from "@/ai/flows/detect-emotion-from-text";

const recommendationFormSchema = z.object({
  prompt: z
    .string()
    .min(3, { message: "Prompt must be at least 3 characters long." }),
});

const analysisFormSchema = z.object({
  audioFile: z
    .any()
    .refine((file) => file?.size > 0, "Please select an audio file."),
});

const emotionFormSchema = z.object({
    imageFile: z.any().refine((file) => file?.size > 0, "Please select an image file."),
});


type RecommendationState = {
  songs?: Song[];
  description?: string;
  error?: {
    _form?: string[];
    prompt?: string[];
  };
};

type AnalysisState = {
  metadata?: { artist: string; title: string };
  error?: string;
};

type EmotionState = {
  songs?: Song[];
  description?: string;
  text?: string;
  emotion?: Emotion;
  error?: string;
}

const initialRecommendationState: RecommendationState = {
  songs: initialSongs,
  description: "A curated selection to get you started. Discover your next favorite song!",
};

const initialAnalysisState: AnalysisState = {};
const initialEmotionState: EmotionState = {};

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <>
          <Search className="mr-2" />
          {text}
        </>
      )}
    </Button>
  );
}

function AnalysisSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <>
          <Search className="mr-2" />
          Analyze
        </>
      )}
    </Button>
  );
}

function EmotionSubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <>
            <HeartPulse className="mr-2" />
            Detect Emotion
          </>
        )}
      </Button>
    );
  }

export default function TuneDetectivePage() {
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<Song[]>(initialSongs);
  const [playlistDescription, setPlaylistDescription] = useState<string>(
    initialRecommendationState.description!
  );

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [recommendationState, recommendAction] = useFormState<RecommendationState, FormData>(
    getRecommendations,
    initialRecommendationState
  );
  
  const [analysisState, analysisAction] = useFormState<AnalysisState, FormData>(
    analyzeSong,
    initialAnalysisState
  );
  
  const [emotionState, emotionAction] = useFormState<EmotionState, FormData>(
    getEmotionRecommendations,
    initialEmotionState
  );

  const recommendationForm = useForm<z.infer<typeof recommendationFormSchema>>({
    resolver: zodResolver(recommendationFormSchema),
    defaultValues: { prompt: "" },
  });

  const analysisForm = useForm({
    resolver: zodResolver(analysisFormSchema),
  });

  const emotionForm = useForm({
    resolver: zodResolver(emotionFormSchema),
  });

  useEffect(() => {
    if (recommendationState?.songs) {
      setPlaylist(recommendationState.songs);
      setPlaylistDescription(recommendationState.description || "");
      setCurrentSong(null);
      setIsPlaying(false);
    }
    if (recommendationState?.error?._form) {
      toast({
        variant: "destructive",
        title: "Error",
        description: recommendationState.error._form.join(", "),
      });
    }
  }, [recommendationState, toast]);

  useEffect(() => {
    if (analysisState?.error) {
       toast({
        variant: "destructive",
        title: "Analysis Error",
        description: analysisState.error,
      });
    }
  }, [analysisState, toast])
  
  useEffect(() => {
    if (emotionState?.error) {
        toast({
            variant: "destructive",
            title: "Emotion Analysis Error",
            description: emotionState.error,
        });
    }
    if (emotionState?.songs) {
      setPlaylist(emotionState.songs);
      setPlaylistDescription(emotionState.description || "");
      setCurrentSong(null);
      setIsPlaying(false);
      // Switch to recommendations tab to show the new playlist
      const trigger = document.querySelector('button[data-radix-collection-item][value="recommend"]');
      if (trigger instanceof HTMLElement) {
        trigger.click();
      }
    }
  }, [emotionState, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            handleNext();
            return 0;
          }
          return p + 1;
        });
      }, 300); // 30s song preview
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  const handlePlay = (song: Song, index: number) => {
    if (currentSong?.title === song.title && currentSong?.artist === song.artist) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setCurrentSongIndex(index);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  const handlePlayPause = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    } else if (playlist.length > 0) {
      handlePlay(playlist[0], 0);
    }
  };
  
  const handleNext = () => {
    if (currentSongIndex === null) return;
    const nextIndex = (currentSongIndex + 1) % playlist.length;
    handlePlay(playlist[nextIndex], nextIndex);
  };
  
  const handlePrev = () => {
    if (currentSongIndex === null) return;
    const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    handlePlay(playlist[prevIndex], prevIndex);
  };
  
  const audioFileRef = analysisForm.register("audioFile");
  const watchedAudioFile = analysisForm.watch("audioFile");
  const audioFileName = useMemo(() => watchedAudioFile?.[0]?.name, [watchedAudioFile]);

  const imageFileRef = emotionForm.register("imageFile");
  const watchedImageFile = emotionForm.watch("imageFile");
  const imageFileName = useMemo(() => watchedImageFile?.[0]?.name, [watchedImageFile]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4">
          <Music className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tighter">TuneDetective</h1>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8">
          <Tabs defaultValue="recommend" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="recommend">Recommendations</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Song</TabsTrigger>
              <TabsTrigger value="emotion">Emotion</TabsTrigger>
            </TabsList>
            <TabsContent value="recommend" className="mt-8">
              <section className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tighter mb-4 font-headline">
                  Discover Your Next Obsession
                </h2>
                <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
                  Describe a mood, a genre, or an artist you like, and let our AI
                  curate a personalized playlist for you.
                </p>
              </section>

              <Form {...recommendationForm}>
                <form
                  action={recommendAction}
                  className="flex flex-col sm:flex-row items-start gap-4 max-w-2xl mx-auto mb-12"
                >
                  <FormField
                    control={recommendationForm.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            placeholder="e.g., '80s synth-pop with female vocals'"
                            {...field}
                            className="h-12 text-lg"
                          />
                        </FormControl>
                         <FormMessage>{recommendationState?.error?.prompt}</FormMessage>
                      </FormItem>
                    )}
                  />
                  <SubmitButton text="Get Tunes" />
                </form>
              </Form>

              <section>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">
                  {recommendationState?.songs === initialSongs ? "Curated For You" : "Your AI Playlist"}
                </h3>
                <p className="text-muted-foreground mb-6">{playlistDescription}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {playlist.map((song, index) => (
                    <Card
                      key={`${song.title}-${index}`}
                      className="group overflow-hidden relative border-0 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer bg-card"
                      onClick={() => handlePlay(song, index)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square relative">
                          <Image
                            src={song.albumArt.imageUrl}
                            alt={`Album art for ${song.title}`}
                            fill
                            data-ai-hint={song.albumArt.imageHint}
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             {currentSong?.title === song.title && isPlaying ? (
                                <Pause className="h-12 w-12 text-white/90" />
                            ) : (
                                <Play className="h-12 w-12 text-white/90" />
                            )}
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 p-3">
                          <h4 className="font-bold text-sm text-white truncate">
                            {song.title}
                          </h4>
                          <p className="text-xs text-white/80 truncate">
                            {song.artist}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </TabsContent>
            
            <TabsContent value="analyze" className="mt-8">
              <section className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tighter mb-4 font-headline">
                  What's That Song?
                </h2>
                <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
                  Upload an audio file, and our AI detective will identify the
                  artist and title for you.
                </p>
              </section>
              
              <Card className="max-w-xl mx-auto">
                <CardContent className="p-6">
                <Form {...analysisForm}>
                  <form action={analysisAction} className="space-y-6">
                    <FormField
                      control={analysisForm.control}
                      name="audioFile"
                      render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="audio-upload" className={cn("w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-accent/20 transition-colors",
                         {'border-primary bg-accent/10': !!audioFileName}
                        )}>
                            {audioFileName ? (
                              <>
                                <FileMusic className="w-12 h-12 text-primary mb-2" />
                                <p className="font-semibold">{audioFileName}</p>
                                <p className="text-sm text-muted-foreground">Click to change file</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                                <p className="font-semibold">Click to upload audio</p>
                                <p className="text-sm text-muted-foreground">MP3, WAV, or OGG</p>
                              </>
                            )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="audio-upload"
                            type="file"
                            className="hidden"
                            accept="audio/mpeg, audio/wav, audio/ogg"
                            {...audioFileRef}
                            onChange={(event) => {
                                field.onChange(event.target.files);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      )}
                    />
                    <AnalysisSubmitButton />
                  </form>
                  </Form>
                  {analysisState?.metadata && (
                     <div className="mt-8 p-4 bg-accent/20 border border-primary/50 rounded-lg text-center">
                        <h4 className="font-bold text-lg">Analysis Result</h4>
                        <p className="text-2xl font-headline text-primary">{analysisState.metadata.title}</p>
                        <p className="text-md text-muted-foreground">by</p>
                        <p className="text-xl font-semibold">{analysisState.metadata.artist}</p>
                     </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emotion" className="mt-8">
               <section className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tighter mb-4 font-headline">
                  Music from Emotion
                </h2>
                <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
                  Upload an image with text. We'll detect the emotion and create a playlist to match.
                </p>
              </section>
              
              <Card className="max-w-xl mx-auto">
                <CardContent className="p-6">
                <Form {...emotionForm}>
                  <form action={emotionAction} className="space-y-6">
                    <FormField
                      control={emotionForm.control}
                      name="imageFile"
                      render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="image-upload" className={cn("w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-accent/20 transition-colors",
                         {'border-primary bg-accent/10': !!imageFileName}
                        )}>
                            {imageFileName ? (
                              <>
                                <FileMusic className="w-12 h-12 text-primary mb-2" />
                                <p className="font-semibold">{imageFileName}</p>
                                <p className="text-sm text-muted-foreground">Click to change file</p>
                              </>
                            ) : (
                              <>
                                <Camera className="w-12 h-12 text-muted-foreground mb-2" />
                                <p className="font-semibold">Click to upload image</p>
                                <p className="text-sm text-muted-foreground">JPG, PNG, or WEBP</p>
                              </>
                            )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/jpeg, image/png, image/webp"
                            {...imageFileRef}
                            onChange={(event) => {
                                field.onChange(event.target.files);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      )}
                    />
                    <EmotionSubmitButton />
                  </form>
                  </Form>
                  {(emotionState?.text || emotionState?.emotion) && (
                     <div className="mt-8 p-4 bg-accent/20 border border-primary/50 rounded-lg text-center space-y-2">
                        <h4 className="font-bold text-lg">Emotion Analysis Result</h4>
                        {emotionState.text && (
                            <div>
                                <p className="text-sm text-muted-foreground">Extracted Text</p>
                                <p className="font-mono bg-background/50 rounded p-2 text-sm">"{emotionState.text}"</p>
                            </div>
                        )}
                        {emotionState.emotion && (
                             <div>
                                <p className="text-sm text-muted-foreground">Detected Emotion</p>
                                <p className="text-2xl font-headline text-primary capitalize">{emotionState.emotion}</p>
                             </div>
                        )}
                        {emotionState.songs && (
                            <p className="text-sm text-green-600 dark:text-green-400 pt-2">Playlist generated! Check the "Recommendations" tab.</p>
                        )}
                     </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>
      </main>

      {currentSong && (
        <footer className="sticky bottom-0 z-40 mt-12">
          <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-t p-4">
            <div className="container flex items-center gap-4">
              <Image
                src={currentSong.albumArt.imageUrl}
                alt={currentSong.title}
                width={56}
                height={56}
                className="rounded-md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{currentSong.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentSong.artist}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handlePrev} aria-label="Previous Song">
                  <SkipBack />
                </Button>
                <Button
                  size="icon"
                  onClick={handlePlayPause}
                  className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 fill-primary-foreground" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} aria-label="Next Song">
                  <SkipForward />
                </Button>
              </div>
              <div className="hidden md:flex flex-1 items-center">
                <Progress value={progress} className="w-full" />
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
