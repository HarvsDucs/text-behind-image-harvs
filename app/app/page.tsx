'use client'

import React, { useRef, useState, useEffect } from 'react';
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { removeBackground } from "@imgly/background-removal";
import { PlusIcon, ReloadIcon } from '@radix-ui/react-icons';
import TextCustomizer from '@/components/editor/text-customizer';
import Image from 'next/image';
import { Accordion } from '@/components/ui/accordion';
import '@/app/fonts.css'
import { ModeToggle } from '@/components/mode-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { uploadToSupabase } from '@/lib/supabase-client';

const AppPage = () => {
    const { user } = useUser();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageSetupDone, setIsImageSetupDone] = useState<boolean>(false);
    const [removedBgImageUrl, setRemovedBgImageUrl] = useState<string | null>(null);
    const [textSets, setTextSets] = useState<Array<any>>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUploadImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                setIsUploading(true);
                const imageUrl = URL.createObjectURL(file);
                setSelectedImage(imageUrl);
                await setupImage(imageUrl);
            } catch (error) {
                console.error('Error processing image:', error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const setupImage = async (imageUrl: string) => {
        try {
            const imageBlob = await removeBackground(imageUrl);
            const url = URL.createObjectURL(imageBlob);
            setRemovedBgImageUrl(url);
            setIsImageSetupDone(true);
        } catch (error) {
            console.error('Failed to remove background:', error);
        }
    };

    const addNewTextSet = () => {
        const newId = Math.max(...textSets.map(set => set.id), 0) + 1;
        setTextSets(prev => [...prev, {
            id: newId,
            text: 'edit',
            fontFamily: 'Inter',
            top: 0,
            left: 0,
            color: 'white',
            fontSize: 200,
            fontWeight: 800,
            opacity: 1,
            shadowColor: 'rgba(0, 0, 0, 0.8)',
            shadowSize: 4,
            rotation: 0
        }]);
    };

    const handleAttributeChange = (id: number, attribute: string, value: any) => {
        setTextSets(prev => prev.map(set => 
            set.id === id ? { ...set, [attribute]: value } : set
        ));
    };

    const duplicateTextSet = (textSet: any) => {
        const newId = Math.max(...textSets.map(set => set.id), 0) + 1;
        setTextSets(prev => [...prev, { ...textSet, id: newId }]);
    };

    const removeTextSet = (id: number) => {
        setTextSets(prev => prev.filter(set => set.id !== id));
    };

    const saveCompositeImage = async () => {
        if (!canvasRef.current || !isImageSetupDone || !user) return;
    
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        try {
            setIsSaving(true);
            const bgImg = new (window as any).Image();
            bgImg.crossOrigin = "anonymous";
            
            await new Promise((resolve, reject) => {
                bgImg.onload = resolve;
                bgImg.onerror = reject;
                bgImg.src = selectedImage || '';
            });

            canvas.width = bgImg.width;
            canvas.height = bgImg.height;
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

            textSets.forEach(textSet => {
                ctx.save();
                ctx.font = `${textSet.fontWeight} ${textSet.fontSize * 3}px ${textSet.fontFamily}`;
                ctx.fillStyle = textSet.color;
                ctx.globalAlpha = textSet.opacity;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const x = canvas.width * (textSet.left + 50) / 100;
                const y = canvas.height * (50 - textSet.top) / 100;

                ctx.translate(x, y);
                ctx.rotate((textSet.rotation * Math.PI) / 180);
                ctx.fillText(textSet.text, 0, 0);
                ctx.restore();
            });

            if (removedBgImageUrl) {
                const removedBgImg = new (window as any).Image();
                removedBgImg.crossOrigin = "anonymous";
                
                await new Promise((resolve, reject) => {
                    removedBgImg.onload = resolve;
                    removedBgImg.onerror = reject;
                    removedBgImg.src = removedBgImageUrl;
                });

                ctx.drawImage(removedBgImg, 0, 0, canvas.width, canvas.height);
            }

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob!);
                }, 'image/png');
            });

            const file = new File([blob], 'text-behind-image.png', { type: 'image/png' });
            const publicUrl = await uploadToSupabase(file, user.id);

            const downloadLink = document.createElement('a');
            downloadLink.download = 'text-behind-image.png';
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.click();

        } catch (error) {
            console.error('Error saving image:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className='flex flex-col h-screen overflow-y-hidden'>
            <header className='flex flex-row items-center justify-between p-5 px-10'>
                <h2 className="text-[12px] md:text-2xl font-semibold tracking-tight">
                    Text behind image editor
                </h2>
                <div className='flex gap-4'>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept=".jpg, .jpeg, .png"
                    />
                    <Button onClick={handleUploadImage} disabled={isUploading}>
                        {isUploading ? (
                            <>
                                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload image'
                        )}
                    </Button>
                    <ModeToggle />
                    <UserButton showName={true} />
                </div>
            </header>
            <Separator />
            {selectedImage ? (
                <div className='flex flex-col md:flex-row items-start justify-start gap-10 w-full h-screen p-10'>
                    <div className="flex flex-col items-start justify-start w-full gap-4">
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <Button 
                            onClick={saveCompositeImage} 
                            disabled={!isImageSetupDone || !user || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save image'
                            )}
                        </Button>
                        <div className="min-h-[400px] w-[80%] p-4 border border-border rounded-lg relative overflow-hidden">
                            {isImageSetupDone ? (
                                <Image
                                    src={selectedImage} 
                                    alt="Uploaded"
                                    layout="fill"
                                    objectFit="contain" 
                                    objectPosition="center" 
                                />
                            ) : (
                                <span className='flex items-center w-full gap-2'>
                                    <ReloadIcon className='animate-spin' /> Loading, please wait
                                </span>
                            )}
                            {isImageSetupDone && textSets.map(textSet => (
                                <div
                                    key={textSet.id}
                                    style={{
                                        position: 'absolute',
                                        top: `${50 - textSet.top}%`,
                                        left: `${textSet.left + 50}%`,
                                        transform: `translate(-50%, -50%) rotate(${textSet.rotation}deg)`,
                                        color: textSet.color,
                                        textAlign: 'center',
                                        fontSize: `${textSet.fontSize}px`,
                                        fontWeight: textSet.fontWeight,
                                        fontFamily: textSet.fontFamily,
                                        opacity: textSet.opacity
                                    }}
                                >
                                    {textSet.text}
                                </div>
                            ))}
                            {removedBgImageUrl && (
                                <Image
                                    src={removedBgImageUrl}
                                    alt="Removed bg"
                                    layout="fill"
                                    objectFit="contain" 
                                    objectPosition="center" 
                                    className="absolute top-0 left-0 w-full h-full"
                                /> 
                            )}
                        </div>
                    </div>
                    <div className='flex flex-col w-full'>
                        <Button variant={'secondary'} onClick={addNewTextSet}>
                            <PlusIcon className='mr-2'/> Add New Text Set
                        </Button>
                        <ScrollArea className="h-[calc(100vh-10rem)] p-2">
                            <Accordion type="single" collapsible className="w-full mt-2">
                                {textSets.map(textSet => (
                                    <TextCustomizer 
                                        key={textSet.id}
                                        textSet={textSet}
                                        handleAttributeChange={handleAttributeChange}
                                        removeTextSet={removeTextSet}
                                        duplicateTextSet={duplicateTextSet}
                                    />
                                ))}
                            </Accordion>
                        </ScrollArea>
                    </div>
                </div>
            ) : (
                <div className='flex items-center justify-center min-h-screen w-full'>
                    <h2 className="text-xl font-semibold">Welcome, get started by uploading an image!</h2>
                </div>
            )}
        </div>
    );
}

export default AppPage;
